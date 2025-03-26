// src/lib/queue/annotationQueue.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import { AnnotationRequest, AnnotationResult } from '@/types/annotation';
import { annotationService } from '../services/annotationService';
import { imageAnnotationService } from '../services/imageAnnotationService';
import { prisma } from '../db/prisma';
import { deploymentConfig } from '../config/deployment';

interface AnnotationJob {
  request: AnnotationRequest;
  callbackUrl?: string;
}

// Redis connection config (for distributed mode)
const connection = deploymentConfig.redis ? {
  host: deploymentConfig.redis.host,
  port: deploymentConfig.redis.port,
  password: deploymentConfig.redis.password,
} : undefined;

// Create job queue
const annotationQueue = new Queue<AnnotationJob, AnnotationResult>('annotation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Create queue events listener
const queueEvents = new QueueEvents('annotation', { connection });

// Create worker
const worker = new Worker<AnnotationJob, AnnotationResult>(
  'annotation',
  async (job) => {
    const { request } = job.data;
    
    // Process annotation based on media type
    if (request.mediaType === 'image' && request.mediaUrl) {
      return await imageAnnotationService.generateImageAnnotation(request);
    } else {
      return await annotationService.generateAnnotation(request);
    }
  },
  { connection, concurrency: deploymentConfig.system.maxConcurrency }
);

// Handle completed jobs
worker.on('completed', async (job, result) => {
  console.log(`Job ${job.id} completed`, result.id);
  
  // Notify via callback URL if provided
  if (job.data.callbackUrl) {
    try {
      await fetch(job.data.callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          annotationId: result.id,
          status: 'completed',
        }),
      });
    } catch (error) {
      console.error(`Error calling callback URL ${job.data.callbackUrl}:`, error);
    }
  }
});

// Handle failed jobs
worker.on('failed', async (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
  
  // Store failure information
  if (job) {
    await prisma.annotationJob.update({
      where: { id: job.id as string },
      data: {
        status: 'failed',
        error: error.message,
      },
    });
    
    // Notify via callback URL if provided
    if (job.data.callbackUrl) {
      try {
        await fetch(job.data.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: job.id,
            status: 'failed',
            error: error.message,
          }),
        });
      } catch (callbackError) {
        console.error(`Error calling callback URL ${job.data.callbackUrl}:`, callbackError);
      }
    }
  }
});

export { annotationQueue };

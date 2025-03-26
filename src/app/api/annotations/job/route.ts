// src/app/api/annotations/job/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { annotationQueue } from '@/lib/queue/annotationQueue';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate request
    if (!data.personaId || !data.content) {
      return NextResponse.json(
        { error: 'personaId and content are required' },
        { status: 400 }
      );
    }
    
    // Create job record in database
    const job = await prisma.annotationJob.create({
      data: {
        status: 'pending',
        request: JSON.stringify(data),
      },
    });
    
    // Add job to queue
    const queuedJob = await annotationQueue.add(
      'annotation',
      {
        request: data,
        callbackUrl: data.callbackUrl,
      },
      {
        jobId: job.id,
      }
    );
    
    return NextResponse.json(
      {
        jobId: job.id,
        status: 'pending',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error creating annotation job:', error);
    return NextResponse.json(
      { error: 'Failed to create annotation job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }
    
    // Get job status from database
    const job = await prisma.annotationJob.findUnique({
      where: { id: jobId },
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Get annotation if job is completed
    let annotation = null;
    if (job.status === 'completed' && job.annotationId) {
      annotation = await prisma.annotation.findUnique({
        where: { id: job.annotationId },
      });
    }
    
    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      annotation,
    });
  } catch (error) {
    console.error('Error fetching annotation job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotation job' },
      { status: 500 }
    );
  }
}

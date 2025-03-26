// src/lib/queue/requestQueue.ts
import pLimit from 'p-limit';
import { deploymentConfig } from '../config/deployment';

// Function type for tasks that can be queued
type QueueableFunction<T> = () => Promise<T>;

// Interface for the result of a queued task
interface QueueResult<T> {
  data?: T;
  error?: Error;
  queueTime: number; // milliseconds spent in queue
  processingTime: number; // milliseconds spent processing
  totalTime: number; // total milliseconds
}

export class RequestQueue {
  private queue: pLimit.Limit;
  private activeRequests = 0;
  private maxConcurrent: number;
  
  constructor(maxConcurrent = deploymentConfig.ollama.maxConcurrentRequests) {
    this.maxConcurrent = maxConcurrent;
    this.queue = pLimit(maxConcurrent);
  }
  
  /**
   * Add a task to the queue
   */
  async enqueue<T>(task: QueueableFunction<T>): Promise<QueueResult<T>> {
    const queueStart = Date.now();
    
    try {
      this.activeRequests++;
      
      const processingStart = Date.now();
      const queueTime = processingStart - queueStart;
      
      const data = await this.queue(task);
      
      const processingEnd = Date.now();
      const processingTime = processingEnd - processingStart;
      
      return {
        data,
        queueTime,
        processingTime,
        totalTime: queueTime + processingTime,
      };
    } catch (error) {
      const processingEnd = Date.now();
      const processingTime = processingEnd - queueStart;
      
      return {
        error: error instanceof Error ? error : new Error(String(error)),
        queueTime: 0, // Unknown actual queue time in case of error
        processingTime,
        totalTime: processingTime,
      };
    } finally {
      this.activeRequests--;
    }
  }
  
  /**
   * Get queue statistics
   */
  getStats() {
    return {
      activeRequests: this.activeRequests,
      pendingRequests: this.queue.pendingCount,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// Create a singleton instance for the Ollama LLM requests
export const ollamaQueue = new RequestQueue();

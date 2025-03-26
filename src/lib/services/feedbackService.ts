// src/lib/services/feedbackService.ts
import { prisma } from '../db/prisma';
import { FeedbackData, FeedbackResult } from '@/types/feedback';

export class FeedbackService {
  async submitFeedback(data: FeedbackData): Promise<FeedbackResult> {
    const feedback = await prisma.feedback.create({
      data: {
        annotationId: data.annotationId,
        userId: data.userId,
        rating: data.rating,
        comment: data.comment,
      },
    });
    
    return feedback;
  }
  
  async getFeedbackForAnnotation(annotationId: string): Promise<FeedbackResult[]> {
    const feedback = await prisma.feedback.findMany({
      where: { annotationId },
      orderBy: { createdAt: 'desc' },
    });
    
    return feedback;
  }
  
  async getFeedbackForPersona(personaId: string, limit = 50): Promise<FeedbackResult[]> {
    const feedback = await prisma.feedback.findMany({
      where: {
        annotation: {
          personaId,
        },
      },
      include: {
        annotation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return feedback;
  }
  
  async getAverageFeedbackRating(personaId: string): Promise<number | null> {
    const result = await prisma.feedback.aggregate({
      where: {
        annotation: {
          personaId,
        },
      },
      _avg: {
        rating: true,
      },
    });
    
    return result._avg.rating;
  }
}

export const feedbackService = new FeedbackService();

// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { feedbackService } from '@/lib/services/feedbackService';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate request
    if (!data.annotationId || !data.userId || data.rating === undefined) {
      return NextResponse.json(
        { error: 'annotationId, userId, and rating are required' },
        { status: 400 }
      );
    }
    
    // Submit feedback
    const feedback = await feedbackService.submitFeedback(data);
    
    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

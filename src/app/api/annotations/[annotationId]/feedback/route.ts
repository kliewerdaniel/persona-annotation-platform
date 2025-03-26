// src/app/api/annotations/[annotationId]/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { feedbackService } from '@/lib/services/feedbackService';

export async function GET(
  request: NextRequest,
  { params }: { params: { annotationId: string } }
) {
  try {
    const annotationId = params.annotationId;
    
    // Get feedback for annotation
    const feedback = await feedbackService.getFeedbackForAnnotation(annotationId);
    
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

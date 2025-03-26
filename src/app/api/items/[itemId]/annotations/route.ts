// src/app/api/annotations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { annotationService } from '@/lib/services/annotationService';

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
    
    // Generate annotation
    const annotation = await annotationService.generateAnnotation(data);
    
    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error('Error generating annotation:', error);
    return NextResponse.json(
      { error: 'Failed to generate annotation' },
      { status: 500 }
    );
  }
}

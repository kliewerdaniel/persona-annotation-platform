// src/app/api/annotations/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { imageAnnotationService } from '@/lib/services/imageAnnotationService';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate request
    if (!data.personaId || !data.mediaUrl) {
      return NextResponse.json(
        { error: 'personaId and mediaUrl are required' },
        { status: 400 }
      );
    }
    
    // Ensure mediaType is image
    data.mediaType = 'image';
    
    // Generate image annotation
    const annotation = await imageAnnotationService.generateImageAnnotation(data);
    
    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error('Error generating image annotation:', error);
    return NextResponse.json(
      { error: 'Failed to generate image annotation' },
      { status: 500 }
    );
  }
}

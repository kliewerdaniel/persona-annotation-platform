// src/app/api/personas/[personaId]/refine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { personaRefinementService } from '@/lib/rlhf/personaRefinement';

export async function POST(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  try {
    const personaId = params.personaId;
    
    // Analyze feedback and refine persona
    const refinementResult = await personaRefinementService.analyzeAndRefinePersona(personaId);
    
    return NextResponse.json(refinementResult);
  } catch (error) {
    console.error('Error refining persona:', error);
    
    if (error instanceof Error && error.message.includes('No feedback available')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to refine persona' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  try {
    const personaId = params.personaId;
    const data = await request.json();
    
    // Apply the refinements
    const updatedPersona = await personaRefinementService.applyRefinement(
      personaId,
      data.refinedPersona
    );
    
    return NextResponse.json(updatedPersona);
  } catch (error) {
    console.error('Error applying refinement:', error);
    return NextResponse.json(
      { error: 'Failed to apply refinement' },
      { status: 500 }
    );
  }
}

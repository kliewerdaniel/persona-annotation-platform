// src/app/api/projects/[projectId]/personas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { personaService } from '@/lib/services/personaService';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    
    // Get all personas for a project
    const personas = await prisma.persona.findMany({
      where: { projectId },
    });
    
    return NextResponse.json(personas);
  } catch (error) {
    console.error('Error fetching personas:', error);
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const data = await request.json();
    
    // Create new persona
    const persona = await personaService.createPersona(projectId, data);
    
    return NextResponse.json(persona, { status: 201 });
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
}

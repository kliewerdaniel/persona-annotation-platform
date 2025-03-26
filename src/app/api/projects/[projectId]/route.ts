// src/app/api/personas/[personaId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { personaService } from '@/lib/services/personaService';

export async function GET(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  try {
    const personaId = params.personaId;
    
    // Get persona details
    const persona = await personaService.getPersona(personaId);
    
    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }
    
    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json({ error: 'Failed to fetch persona' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  try {
    const personaId = params.personaId;
    const data = await request.json();
    
    // Update persona
    const persona = await personaService.updatePersona(personaId, data);
    
    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error updating persona:', error);
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { personaId: string } }
) {
  try {
    const personaId = params.personaId;
    
    // Delete persona
    await personaService.deletePersona(personaId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 });
  }
}

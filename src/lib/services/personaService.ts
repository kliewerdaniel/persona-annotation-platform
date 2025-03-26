// src/lib/services/personaService.ts
import { prisma } from '../db/prisma';
import { chromaDBService } from '../chromadb';
import { ollamaService } from '../ollama';
import { PersonaData, PersonaTrait, PersonaExample } from '@/types/persona';

export class PersonaService {
  async createPersona(projectId: string, personaData: Omit<PersonaData, 'id' | 'prompt'>): Promise<PersonaData> {
    // Generate system prompt from persona traits and examples
    const systemPrompt = await this.generateSystemPrompt(personaData.traits, personaData.examples);
    
    // Create persona in database
    const persona = await prisma.persona.create({
      data: {
        name: personaData.name,
        description: personaData.description,
        traits: JSON.stringify(personaData.traits),
        projectId,
      },
    });
    
    // Create the text representation for embedding
    const textRepresentation = this.createPersonaTextRepresentation(personaData);
    
    // Store in ChromaDB
    await chromaDBService.addPersona(
      persona.id,
      textRepresentation,
      {
        name: personaData.name,
        description: personaData.description,
        systemPrompt,
      }
    );
    
    return {
      id: persona.id,
      name: personaData.name,
      description: personaData.description,
      traits: personaData.traits,
      examples: personaData.examples,
      prompt: systemPrompt,
    };
  }
  
  async getPersona(personaId: string): Promise<PersonaData | null> {
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
    });
    
    if (!persona) return null;
    
    // Parse the traits from JSON string
    const traits = JSON.parse(persona.traits) as PersonaTrait[];
    
    // Retrieve examples from ChromaDB metadata
    const personaResults = await chromaDBService.searchSimilarPersonas(persona.id, 1);
    
    if (personaResults.length === 0) {
      throw new Error(`Persona ${personaId} not found in ChromaDB`);
    }
    
    const metadata = personaResults[0].metadata;
    
    return {
      id: persona.id,
      name: persona.name,
      description: persona.description || '',
      traits,
      examples: metadata.examples || [],
      prompt: metadata.systemPrompt,
    };
  }
  
  async updatePersona(personaId: string, updateData: Partial<PersonaData>): Promise<PersonaData> {
    // Get current persona
    const currentPersona = await this.getPersona(personaId);
    
    if (!currentPersona) {
      throw new Error(`Persona ${personaId} not found`);
    }
    
    // Merge current with updates
    const updatedPersona = {
      ...currentPersona,
      ...updateData,
    };
    
    // Generate new system prompt if traits or examples changed
    if (updateData.traits || updateData.examples) {
      updatedPersona.prompt = await this.generateSystemPrompt(
        updatedPersona.traits,
        updatedPersona.examples
      );
    }
    
    // Update in database
    await prisma.persona.update({
      where: { id: personaId },
      data: {
        name: updatedPersona.name,
        description: updatedPersona.description,
        traits: JSON.stringify(updatedPersona.traits),
        updatedAt: new Date(),
      },
    });
    
    // Update in ChromaDB
    const textRepresentation = this.createPersonaTextRepresentation(updatedPersona);
    
    await chromaDBService.addPersona(
      personaId,
      textRepresentation,
      {
        name: updatedPersona.name,
        description: updatedPersona.description,
        systemPrompt: updatedPersona.prompt,
        examples: updatedPersona.examples,
      }
    );
    
    return updatedPersona;
  }
  
  async deletePersona(personaId: string): Promise<void> {
    // Delete from database
    await prisma.persona.delete({
      where: { id: personaId },
    });
    
    // Delete from ChromaDB
    await chromaDBService.deletePersona(personaId);
  }
  
  private async generateSystemPrompt(traits: PersonaTrait[], examples: PersonaExample[]): Promise<string> {
    // Create a prompt for the LLM to generate a system prompt
    const traitsText = traits
      .map(trait => `- ${trait.name}: ${trait.value.toFixed(2)} (${trait.description || ''})`)
      .join('\n');
    
    const examplesText = examples
      .map(example => `Input: ${example.input}\nExpected Output: ${example.output}${example.explanation ? `\nExplanation: ${example.explanation}` : ''}`)
      .join('\n\n');
    
    const promptForLLM = `
You are an expert at creating detailed persona descriptions for AI assistants.
I need you to create a system prompt that will guide an AI to act according to the following personality traits:

${traitsText}

Here are examples of how this persona should respond:

${examplesText}

Create a detailed system prompt that captures this persona's essence and will guide an AI to produce similar outputs to the examples.
The system prompt should be clear, specific, and instructive.
`;

    // Generate the system prompt using Ollama
    const response = await ollamaService.generate({
      prompt: promptForLLM,
      temperature: 0.7,
    });
    
    return response.text.trim();
  }
  
  private createPersonaTextRepresentation(persona: Omit<PersonaData, 'id' | 'prompt'>): string {
    // Create a text representation for vector embedding
    const traitsText = persona.traits
      .map(trait => `${trait.name}: ${trait.value.toFixed(2)}`)
      .join(', ');
    
    return `Persona Name: ${persona.name}
Description: ${persona.description}
Traits: ${traitsText}
Examples: ${persona.examples.length} example(s) provided`;
  }
}

export const personaService = new PersonaService();

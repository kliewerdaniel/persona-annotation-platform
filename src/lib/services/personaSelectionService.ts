// src/lib/services/personaSelectionService.ts
import { chromaDBService } from '../chromadb';

export class PersonaSelectionService {
  async findBestPersonas(
    content: string,
    taskDescription: string,
    projectId: string,
    limit = 3
  ): Promise<Array<{ id: string; score: number; name: string }>> {
    // Combine content and task description for better matching
    const query = `${taskDescription}\n\n${content}`;
    
    // Search for similar personas in ChromaDB
    const results = await chromaDBService.searchSimilarPersonas(query, limit);
    
    // Format results
    return results.map(result => ({
      id: result.id,
      score: 1 - result.score, // Convert distance to similarity score
      name: result.metadata.name,
    }));
  }
}

export const personaSelectionService = new PersonaSelectionService();

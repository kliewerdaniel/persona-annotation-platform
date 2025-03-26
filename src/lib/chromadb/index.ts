// src/lib/chromadb/index.ts
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Define the ChromaDB client directory
const CHROMA_DIR = path.join(process.cwd(), 'chroma_db');

// Ensure the ChromaDB directory exists
if (!fs.existsSync(CHROMA_DIR)) {
  fs.mkdirSync(CHROMA_DIR, { recursive: true });
}

// Define interface for ChromaDB operations
export interface ChromaDBService {
  addPersona(personaId: string, text: string, metadata: Record<string, any>): Promise<void>;
  searchSimilarPersonas(query: string, limit?: number): Promise<Array<{ id: string; score: number; metadata: Record<string, any> }>>;
  deletePersona(personaId: string): Promise<void>;
}

// Python script runner for ChromaDB operations
class PythonChromaDBService implements ChromaDBService {
  private runPythonScript(scriptName: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'chromadb', `${scriptName}.py`);
      
      const process = spawn('python', [scriptPath, ...args]);
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      let errorOutput = '';
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script error: ${errorOutput}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  async addPersona(personaId: string, text: string, metadata: Record<string, any>): Promise<void> {
    await this.runPythonScript('add_persona', [
      personaId,
      text,
      JSON.stringify(metadata),
      CHROMA_DIR
    ]);
  }

  async searchSimilarPersonas(query: string, limit = 5): Promise<Array<{ id: string; score: number; metadata: Record<string, any> }>> {
    const result = await this.runPythonScript('search_personas', [
      query,
      limit.toString(),
      CHROMA_DIR
    ]);
    
    return JSON.parse(result);
  }

  async deletePersona(personaId: string): Promise<void> {
    await this.runPythonScript('delete_persona', [
      personaId,
      CHROMA_DIR
    ]);
  }
}

// Export an instance of the service
export const chromaDBService = new PythonChromaDBService();

// src/lib/ollama/index.ts

import { ollamaQueue } from '../queue/requestQueue';






export interface OllamaConfig {
    baseUrl: string;
    model: string;
  }
  
  export interface GenerationOptions {
    prompt: string;
    system?: string;
    temperature?: number;
    maxTokens?: number;
  }
  
  export interface GenerationResponse {
    text: string;
    model: string;
    promptTokens: number;
    generatedTokens: number;
  }
  
  export class OllamaService {
    private baseUrl: string;
    private model: string;
  
    constructor(config: OllamaConfig) {
      this.baseUrl = config.baseUrl;
      this.model = config.model;
    }
  
    async generate(options: GenerationOptions): Promise<GenerationResponse> {
        const result = await ollamaQueue.enqueue(async () => {
          const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: this.model,
              prompt: options.prompt,
              system: options.system,
              options: {
                temperature: options.temperature ?? 0.7,
                num_predict: options.maxTokens,
              },
            }),
          });
    
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${response.status} ${errorText}`);
          }
    
          const data = await response.json();
          return {
            text: data.response,
            model: data.model,
            promptTokens: data.prompt_eval_count,
            generatedTokens: data.eval_count,
          };
        });
        
        if (result.error) {
          throw result.error;
        }
        
        return result.data!;
      }
  
    async getModels(): Promise<string[]> {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      
      const data = await response.json();
      return data.models.map((model: any) => model.name);
    }
  
    setModel(model: string): void {
      this.model = model;
    }
  }
  
  // Default instance with localhost
  export const ollamaService = new OllamaService({
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
  });
  
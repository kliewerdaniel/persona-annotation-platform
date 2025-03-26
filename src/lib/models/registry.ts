// src/lib/models/registry.ts
import { ollamaService } from '../ollama';

export interface ModelProvider {
  id: string;
  name: string;
  type: 'text' | 'image' | 'audio' | 'multimodal';
  available: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  contextLength: number;
  recommended: boolean;
}

export class ModelRegistry {
  private providers: Record<string, ModelProvider> = {};
  private models: Record<string, ModelInfo> = {};
  
  constructor() {
    // Register default providers
    this.registerProvider({
      id: 'ollama',
      name: 'Ollama',
      type: 'text',
      available: true,
    });
    
    // Register default models
    this.registerModel({
      id: 'ollama/llama2',
      name: 'Llama 2',
      provider: 'ollama',
      description: 'A powerful open-source LLM by Meta',
      capabilities: ['text-generation', 'summarization', 'classification'],
      contextLength: 4096,
      recommended: true,
    });
    
    this.registerModel({
      id: 'ollama/mistral',
      name: 'Mistral 7B',
      provider: 'ollama',
      description: 'High-performance small language model',
      capabilities: ['text-generation', 'question-answering'],
      contextLength: 8192,
      recommended: true,
    });
  }
  
  registerProvider(provider: ModelProvider): void {
    this.providers[provider.id] = provider;
  }
  
  registerModel(model: ModelInfo): void {
    this.models[model.id] = model;
  }
  
  async getAvailableModels(): Promise<ModelInfo[]> {
    // Fetch available Ollama models
    const ollamaModels = await this.getOllamaModels();
    
    // Filter registered models to only those available
    return Object.values(this.models).filter(model => {
      if (model.provider === 'ollama') {
        return ollamaModels.includes(model.name.toLowerCase());
      }
      return true;
    });
  }
  
  getModelById(id: string): ModelInfo | null {
    return this.models[id] || null;
  }
  
  getProviderById(id: string): ModelProvider | null {
    return this.providers[id] || null;
  }
  
  private async getOllamaModels(): Promise<string[]> {
    try {
      const models = await ollamaService.getModels();
      return models;
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }
}

export const modelRegistry = new ModelRegistry();

// src/lib/models/factory.ts
import { modelRegistry } from './registry';
import { ollamaService } from '../ollama';

export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ModelResponse {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export abstract class AIModel {
  protected options: ModelOptions;
  
  constructor(options: ModelOptions = {}) {
    this.options = {
      temperature: 0.7,
      maxTokens: 1024,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      ...options,
    };
  }
  
  abstract generate(prompt: string, systemPrompt?: string): Promise<ModelResponse>;
}

export class OllamaModel extends AIModel {
  private modelName: string;
  
  constructor(modelName: string, options: ModelOptions = {}) {
    super(options);
    this.modelName = modelName;
  }
  
  async generate(prompt: string, systemPrompt?: string): Promise<ModelResponse> {
    // Set the model in the Ollama service
    ollamaService.setModel(this.modelName);
    
    // Generate text
    const response = await ollamaService.generate({
      prompt,
      system: systemPrompt,
      temperature: this.options.temperature,
      maxTokens: this.options.maxTokens,
    });
    
    return {
      text: response.text,
      model: response.model,
      promptTokens: response.promptTokens,
      completionTokens: response.generatedTokens,
      totalTokens: response.promptTokens + response.generatedTokens,
    };
  }
}

export class ModelFactory {
  static createModel(modelId: string, options: ModelOptions = {}): AIModel | null {
    const model = modelRegistry.getModelById(modelId);
    
    if (!model) {
      return null;
    }
    
    if (model.provider === 'ollama') {
      // Extract actual model name (after the provider prefix)
      const modelName = model.id.split('/')[1];
      return new OllamaModel(modelName, options);
    }
    
    // Add other model providers as needed
    
    return null;
  }
}

// src/lib/services/annotationService.ts
import { prisma } from '../db/prisma';
import { personaService } from './personaService';
import { ollamaService } from '../ollama';
import { AnnotationRequest, AnnotationResult } from '@/types/annotation';
import { cacheService } from '../cache';
import { ModelFactory } from '../models/factory';



export class AnnotationService {
    async generateAnnotation(request: AnnotationRequest): Promise<AnnotationResult> {
      // Check cache first
      const cacheKey = `annotation:${request.personaId}:${Buffer.from(request.content).toString('base64')}`;
      const cachedResult = await cacheService.get<AnnotationResult>(cacheKey, {
        namespace: 'annotations',
        ttl: 3600, // 1 hour cache
      });
      
      if (cachedResult) {
        return cachedResult;
      }
      
      // Get the persona
    const persona = await personaService.getPersona(request.personaId);
    
    if (!persona) {
      throw new Error(`Persona ${request.personaId} not found`);
    }
    
    // Get the model information from the persona
    const modelId = persona.modelId || 'ollama/llama2'; // Default model
    
    // Create the model instance
    const model = ModelFactory.createModel(modelId, {
      temperature: 0.3, // Lower temperature for more focused annotations
    });
    
    if (!model) {
      throw new Error(`Model ${modelId} not found or not available`);
    }
    
    // Prepare the prompt for annotation
    const prompt = `Please analyze the following content and provide an annotation:

${request.content}`;

    // Generate annotation using the model
    const modelResponse = await model.generate(prompt, persona.prompt);
    
    // Calculate a simple confidence score
    const confidence = this.calculateConfidence(modelResponse.text);
      
      // Get item from database or create a temporary one if not provided
      let item;
      if (request.itemId) {
        item = await prisma.item.findUnique({
          where: { id: request.itemId },
        });
        
        if (!item) {
          throw new Error(`Item ${request.itemId} not found`);
        }
      }
      
      // Prepare the prompt for annotation
      const prompt = `Please analyze the following content and provide an annotation:
  
  ${request.content}`;
  
      // Generate annotation using Ollama
      const ollamaResponse = await ollamaService.generate({
        prompt,
        system: persona.prompt,
        temperature: 0.3, // Lower temperature for more focused annotations
      });
      
      // Calculate a simple confidence score
      const confidence = this.calculateConfidence(ollamaResponse.text);
      
      // Save annotation to database if we have an item
      let annotation;
      if (request.itemId) {
        annotation = await prisma.annotation.create({
          data: {
            itemId: request.itemId,
            personaId: request.personaId,
            annotation: ollamaResponse.text,
            confidence,
          },
        });
      } else {
        // Create an ephemeral annotation result
        annotation = {
          id: 'temp-' + Date.now(),
          itemId: 'temp-item',
          personaId: request.personaId,
          annotation: ollamaResponse.text,
          confidence,
          createdAt: new Date(),
        };
      }
      
      // Cache the result
      await cacheService.set(cacheKey, annotation, {
        namespace: 'annotations',
        ttl: 3600, // 1 hour cache
      });
      
      return annotation;
    }
  
  async getAnnotations(itemId: string): Promise<AnnotationResult[]> {
    const annotations = await prisma.annotation.findMany({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
    });
    
    return annotations;
  }
  
  private calculateConfidence(text: string): number {
    // A simple heuristic for confidence based on response length and structure
    // In a real system, this would be more sophisticated
    const length = text.length;
    
    if (length < 10) return 0.1;
    if (length < 50) return 0.3;
    if (length < 200) return 0.5;
    if (length < 500) return 0.7;
    return 0.9;
  }
}

export const annotationService = new AnnotationService();

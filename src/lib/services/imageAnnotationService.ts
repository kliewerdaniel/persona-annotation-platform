// src/lib/services/imageAnnotationService.ts
import { prisma } from '../db/prisma';
import { personaService } from './personaService';
import { ModelFactory } from '../models/factory';
import { AnnotationRequest, AnnotationResult } from '@/types/annotation';

export class ImageAnnotationService {
  async generateImageAnnotation(request: AnnotationRequest): Promise<AnnotationResult> {
    if (!request.mediaUrl) {
      throw new Error('Media URL is required for image annotation');
    }
    
    // Get the persona
    const persona = await personaService.getPersona(request.personaId);
    
    if (!persona) {
      throw new Error(`Persona ${request.personaId} not found`);
    }
    
    // For this example, we'll use a text model and include the image URL
    // In a more advanced implementation, you would use a multimodal model
    // or integrate with computer vision APIs
    
    const modelId = persona.modelId || 'ollama/llama2';
    const model = ModelFactory.createModel(modelId, {
      temperature: 0.3,
    });
    
    if (!model) {
      throw new Error(`Model ${modelId} not found or not available`);
    }
    
    // Prepare the prompt for image annotation
    const prompt = `Please analyze the image at URL: ${request.mediaUrl}
    
${request.content ? `Additional context: ${request.content}` : ''}

Provide a detailed annotation of what you see in the image.`;

    // Generate annotation
    const modelResponse = await model.generate(prompt, persona.prompt);
    
    // Calculate confidence
    const confidence = 0.7; // Placeholder value
    
    // Save annotation to database if we have an item
    let annotation;
    if (request.itemId) {
      annotation = await prisma.annotation.create({
        data: {
          itemId: request.itemId,
          personaId: request.personaId,
          annotation: modelResponse.text,
          confidence,
          metadata: JSON.stringify({
            mediaType: 'image',
            mediaUrl: request.mediaUrl,
          }),
        },
      });
    } else {
      // Create an ephemeral annotation result
      annotation = {
        id: 'temp-' + Date.now(),
        itemId: 'temp-item',
        personaId: request.personaId,
        annotation: modelResponse.text,
        confidence,
        createdAt: new Date(),
      };
    }
    
    return annotation;
  }
}

export const imageAnnotationService = new ImageAnnotationService();

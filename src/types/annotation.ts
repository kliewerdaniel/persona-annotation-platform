// src/types/annotation.ts
export interface AnnotationRequest {
    itemId: string;
    personaId: string;
    content: string;
    mediaType?: 'text' | 'image' | 'audio';
    mediaUrl?: string;
    metadata?: Record<string, any>;
  }
  
  export interface AnnotationResult {
    id: string;
    itemId: string;
    personaId: string;
    annotation: string;
    confidence?: number;
    createdAt: Date;
  }
  
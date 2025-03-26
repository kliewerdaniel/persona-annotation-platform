// src/types/feedback.ts
export interface FeedbackData {
    annotationId: string;
    userId: string;
    rating: number; // 1-5 scale
    comment?: string;
  }
  
  export interface FeedbackResult {
    id: string;
    annotationId: string;
    userId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
  }
  
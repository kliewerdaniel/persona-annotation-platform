// src/lib/db/optimization.ts
import { prisma } from './prisma';

export class DatabaseOptimization {
  /**
   * Creates indices for frequently queried columns
   */
  async createIndices(): Promise<void> {
    // Execute raw SQL to create indices
    // Note: Prisma doesn't directly support index creation via its API
    
    // For SQLite
    if (process.env.DATABASE_TYPE !== 'postgres') {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_annotations_persona_id ON annotations(persona_id);
        CREATE INDEX IF NOT EXISTS idx_annotations_item_id ON annotations(item_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_annotation_id ON feedback(annotation_id);
        CREATE INDEX IF NOT EXISTS idx_personas_project_id ON personas(project_id);
      `;
    } 
    // For PostgreSQL
    else {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_annotations_persona_id ON annotations(persona_id);
        CREATE INDEX IF NOT EXISTS idx_annotations_item_id ON annotations(item_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_annotation_id ON feedback(annotation_id);
        CREATE INDEX IF NOT EXISTS idx_personas_project_id ON personas(project_id);
      `;
    }
  }
  
  /**
   * Vacuum/optimize the database
   */
  async optimizeDatabase(): Promise<void> {
    // For SQLite
    if (process.env.DATABASE_TYPE !== 'postgres') {
      await prisma.$executeRaw`VACUUM;`;
    } 
    // For PostgreSQL
    else {
      // Analyze tables for better query planning
      await prisma.$executeRaw`ANALYZE;`;
      // Vacuum to reclaim space
      await prisma.$executeRaw`VACUUM;`;
    }
  }
  
  /**
   * Clean up old data to improve performance
   */
  async cleanupOldData(daysToKeep = 30): Promise<{ deletedAnnotations: number; deletedFeedback: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Delete old feedback first (due to foreign key constraints)
    const deletedFeedback = await prisma.feedback.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    
    // Delete old annotations
    const deletedAnnotations = await prisma.annotation.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        // Only delete annotations without recent feedback
        feedback: {
          none: {
            createdAt: {
              gte: cutoffDate,
            },
          },
        },
      },
    });
    
    return {
      deletedAnnotations: deletedAnnotations.count,
      deletedFeedback: deletedFeedback.count,
    };
  }
}

export const databaseOptimization = new DatabaseOptimization();

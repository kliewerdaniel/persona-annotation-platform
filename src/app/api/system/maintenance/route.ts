// src/app/api/system/maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { databaseOptimization } from '@/lib/db/optimization';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const operation = data.operation;
    
    let result;
    
    switch (operation) {
      case 'create-indices':
        await databaseOptimization.createIndices();
        result = { success: true, message: 'Indices created successfully' };
        break;
      
      case 'optimize-database':
        await databaseOptimization.optimizeDatabase();
        result = { success: true, message: 'Database optimized successfully' };
        break;
      
      case 'cleanup-old-data':
        const daysToKeep = data.daysToKeep || 30;
        const cleanup = await databaseOptimization.cleanupOldData(daysToKeep);
        result = { 
          success: true, 
          message: `Cleanup completed successfully`,
          deletedAnnotations: cleanup.deletedAnnotations,
          deletedFeedback: cleanup.deletedFeedback,
        };
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error performing maintenance:', error);
    return NextResponse.json(
      { error: 'Maintenance operation failed' },
      { status: 500 }
    );
  }
}

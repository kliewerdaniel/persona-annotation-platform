// src/app/api/system/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { systemHealthService } from '@/lib/services/systemHealthService';

export async function GET() {
  try {
    const health = await systemHealthService.checkSystemHealth();
    return NextResponse.json(health);
  } catch (error) {
    console.error('Error checking system health:', error);
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    );
  }
}

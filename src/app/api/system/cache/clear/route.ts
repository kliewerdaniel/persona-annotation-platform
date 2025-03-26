// src/app/api/system/cache/clear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';

export async function POST() {
  try {
    await cacheService.clear();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

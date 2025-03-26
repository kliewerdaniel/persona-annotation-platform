// src/app/api/ws/route.ts
import { NextResponse } from 'next/server';
import { getWebSocketServer } from './websocket';
import { headers } from 'next/headers';

// Initialize the WebSocket server
const wss = getWebSocketServer();

// This handler is just to acknowledge the WebSocket endpoint
export async function GET() {
  return new NextResponse('WebSocket endpoint is available', { status: 200 });
}

// Support WebSocket upgrade
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

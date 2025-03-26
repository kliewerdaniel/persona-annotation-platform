// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authService } from './lib/auth/authService';

export async function middleware(request: NextRequest) {
  // Skip authentication for public routes and WebSocket connections
  const publicPaths = ['/api/auth/login', '/api/auth/register', '/login', '/register', '/api/ws', '/api/websocket'];
  const path = request.nextUrl.pathname;
  
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }
  
  // Check if it's an API route
  if (path.startsWith('/api/')) {
    // Get token from Authorization header
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate token
    const user = await authService.validateToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Add user to request
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // DEVELOPMENT MODE: Skip auth for development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // For non-API routes, check for token in cookie
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Validate token
  const user = await authService.validateToken(token);
  
  if (!user) {
    // Clear invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Use existing Prisma instance if available in global scope,
// or create a new instance
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Store the instance in global scope for development environments
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

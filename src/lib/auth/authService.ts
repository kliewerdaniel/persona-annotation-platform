// src/lib/auth/authService.ts
import { prisma } from '../db/prisma';
import { User, AuthRequest, AuthResponse } from './types';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret';

export class AuthService {
  async login(request: AuthRequest): Promise<AuthResponse> {
    // In a production environment, use a proper authentication system
    // This is a simplified version for local development
    
    const user = await prisma.user.findFirst({
      where: {
        email: request.email,
      },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // In a real system, verify the password with a proper hashing algorithm
    // Here we're just using a placeholder
    const passwordValid = this.verifyPassword(request.password, user.passwordHash);
    
    if (!passwordValid) {
      throw new Error('Invalid password');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'annotator' | 'reviewer',
        createdAt: user.createdAt,
      },
      token,
    };
  }
  
  async register(user: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: user.email,
      },
    });
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const passwordHash = this.hashPassword(user.password);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
      },
    });
    
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as 'admin' | 'annotator' | 'reviewer',
      createdAt: newUser.createdAt,
    };
  }
  
  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
      });
      
      if (!user) {
        return null;
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'annotator' | 'reviewer',
        createdAt: user.createdAt,
      };
    } catch (error) {
      return null;
    }
  }
  
  private hashPassword(password: string): string {
    // In a production environment, use a proper password hashing library
    // This is a simplified version for local development
    return crypto.createHash('sha256').update(password).digest('hex');
  }
  
  private verifyPassword(password: string, hash: string): boolean {
    const passwordHash = this.hashPassword(password);
    return passwordHash === hash;
  }
}

export const authService = new AuthService();

// src/lib/auth/types.ts
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'annotator' | 'reviewer';
    createdAt: Date;
  }
  
  export interface AuthRequest {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
  
// src/lib/websocket/init.ts
import { Server as HTTPServer } from 'http';
import { webSocketService } from './index';

export const initializeWebSockets = (server: HTTPServer) => {
  webSocketService.initialize(server);
  
  console.log('WebSocket server initialized');
};

// src/lib/websocket/index.ts
import { Server as HTTPServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { parse } from 'url';

// Define message types
export enum MessageType {
  ANNOTATION_CREATED = 'annotation_created',
  ANNOTATION_UPDATED = 'annotation_updated',
  FEEDBACK_SUBMITTED = 'feedback_submitted',
  PERSONA_UPDATED = 'persona_updated',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
}

// Define message interface
export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  sender?: string;
  timestamp?: number;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, any>();
  
  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ noServer: true });
    
    // Handle WebSocket connections
    server.on('upgrade', (request, socket, head) => {
      const { pathname } = parse(request.url || '', true);
      
      if (pathname === '/api/ws') {
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit('connection', ws, request);
        });
      }
    });
    
    // Set up connection handler
    this.wss.on('connection', (ws, request) => {
      // Generate client ID
      const clientId = Math.random().toString(36).substring(2, 15);
      
      // Store client
      this.clients.set(clientId, {
        ws,
        joinTime: Date.now(),
      });
      
      // Send welcome message
      this.sendToClient(clientId, {
        type: MessageType.USER_JOINED,
        payload: {
          id: clientId,
          message: 'Connected to annotation platform',
        },
        timestamp: Date.now(),
      });
      
      // Announce to other clients
      this.broadcast({
        type: MessageType.USER_JOINED,
        payload: {
          id: clientId,
        },
        timestamp: Date.now(),
      }, clientId);
      
      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
          
          // Add sender and timestamp if not present
          parsedMessage.sender = parsedMessage.sender || clientId;
          parsedMessage.timestamp = parsedMessage.timestamp || Date.now();
          
          // Broadcast message to other clients
          this.broadcast(parsedMessage, clientId);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        // Remove client
        this.clients.delete(clientId);
        
        // Announce to other clients
        this.broadcast({
          type: MessageType.USER_LEFT,
          payload: {
            id: clientId,
          },
          timestamp: Date.now(),
        });
      });
    });
  }
  
  /**
   * Send a message to all connected clients
   */
  broadcast(message: WebSocketMessage, excludeClientId?: string) {
    this.clients.forEach((client, clientId) => {
      if (excludeClientId && clientId === excludeClientId) {
        return;
      }
      
      this.sendToClient(clientId, message);
    });
  }
  
  /**
   * Send a message to a specific client
   */
  sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    
    if (client && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message));
    }
  }
  
  /**
   * Get number of connected clients
   */
  getConnectedCount() {
    return this.clients.size;
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

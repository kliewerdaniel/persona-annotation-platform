// src/pages/api/websocket.js
import { WebSocketServer } from 'ws';

// Define message types to match front-end
const MessageType = {
  ANNOTATION_CREATED: 'annotation_created',
  ANNOTATION_UPDATED: 'annotation_updated',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  PERSONA_UPDATED: 'persona_updated',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
};

// Store WebSocket server as global variable to persist between API calls
let wss = null;

export default function handler(req, res) {
  // Set CORS headers for WebSocket handshake
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Initialize WebSocket server if not already created
  if (!wss) {
    console.log('Creating new WebSocket server instance');
    
    // Create WebSocket server
    wss = new WebSocketServer({ 
      noServer: true,
      clientTracking: true,
    });
    
    // Setup connection handler
    wss.on('connection', (ws) => {
      // Generate client ID
      const clientId = Math.random().toString(36).substring(2, 15);
      console.log(`WebSocket client connected: ${clientId}`);
      
      // Store clientId on the WebSocket
      ws.clientId = clientId;
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: MessageType.USER_JOINED,
        payload: {
          id: clientId,
          message: 'Connected to annotation platform'
        },
        timestamp: Date.now()
      }));
      
      // Handle incoming messages
      ws.on('message', (message) => {
        console.log(`Message received from ${clientId}:`, message.toString());
        try {
          const parsedMessage = JSON.parse(message.toString());
          
          // Broadcast message to all other clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) { // WebSocket.OPEN
              client.send(JSON.stringify({
                ...parsedMessage,
                sender: clientId,
                timestamp: Date.now()
              }));
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        
        // Notify other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({
              type: MessageType.USER_LEFT,
              payload: {
                id: clientId
              },
              timestamp: Date.now()
            }));
          }
        });
      });
      
      // Handle WebSocket errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
      
      // Announce new client to others
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: MessageType.USER_JOINED,
            payload: {
              id: clientId
            },
            timestamp: Date.now()
          }));
        }
      });
    });
    
    // Handle server errors
    wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
    
    console.log('WebSocket server initialized');
  }

  // Handle WebSocket upgrade
  if (!res.socket.server.ws) {
    // Store WebSocket server instance
    res.socket.server.ws = wss;

    // Setup upgrade handler
    res.socket.server.on('upgrade', (request, socket, head) => {
      // Only handle WebSocket paths
      if (request.url.startsWith('/api/websocket')) {
        console.log('WebSocket upgrade request received:', request.url);
        
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    });
  }

  // For standard HTTP requests, return a status message
  if (req.headers.upgrade !== 'websocket') {
    return res.status(200).json({ 
      status: 'success', 
      message: 'WebSocket server is running',
      clients: wss.clients.size
    });
  }

  // If it's a WebSocket upgrade request, res will be handled by the upgrade event
  res.end();
}

// Disable body parsing for WebSocket connections
export const config = {
  api: {
    bodyParser: false,
  },
};

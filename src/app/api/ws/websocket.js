// src/app/api/ws/websocket.js
import { WebSocketServer } from 'ws';

let wss = null;

export function getWebSocketServer() {
  if (!wss) {
    console.log('Creating new WebSocket server instance');
    wss = new WebSocketServer({
      noServer: true,
      clientTracking: true,
    });
    
    // Set up connection handler
    wss.on('connection', (ws) => {
      // Generate client ID
      const clientId = Math.random().toString(36).substring(2, 15);
      console.log(`WebSocket client connected: ${clientId}`);
      
      // Add client ID to ws instance
      ws.clientId = clientId;
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'user_joined',
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
          
          // Broadcast message to all clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1 /* OPEN */) {
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
      
      // Handle disconnect
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        
        // Notify other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1 /* OPEN */) {
            client.send(JSON.stringify({
              type: 'user_left',
              payload: {
                id: clientId
              },
              timestamp: Date.now()
            }));
          }
        });
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
      
      // Announce to other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1 /* OPEN */) {
          client.send(JSON.stringify({
            type: 'user_joined',
            payload: {
              id: clientId
            },
            timestamp: Date.now()
          }));
        }
      });
    });
    
    // Log any server errors
    wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
    
    console.log('WebSocket server initialized');
  }
  
  return wss;
}

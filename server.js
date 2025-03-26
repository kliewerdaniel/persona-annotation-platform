// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');
const path = require('path');

// WebSocket service implementation
function initializeWebSocketServer(server) {
  const wss = new WebSocket.Server({ 
    noServer: true,
    // Enable ping-pong to detect disconnects
    pingInterval: 30000,
    pingTimeout: 5000,
  });
  
  // Handle WebSocket connections
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);
    
    if (pathname === '/api/ws') {
      console.log('WebSocket upgrade request received');
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
  
  // Set up connection handler
  wss.on('connection', (ws, request) => {
    // Generate client ID
    const clientId = Math.random().toString(36).substring(2, 15);
    console.log(`WebSocket client connected: ${clientId}`);
    
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
          if (client !== ws && client.readyState === WebSocket.OPEN) {
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
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  });
  
  // Log any server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  console.log('WebSocket server initialized');
  return wss;
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  
  // Initialize WebSockets
  const wss = initializeWebSocketServer(server);
  
  // Use the same port as the Next.js dev server to integrate with it
  const port = parseInt(process.env.PORT || '3003', 10);
  
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> WebSocket server running on ws://localhost:${port}/api/ws`);
    console.log(`> Connected clients: ${wss.clients.size}`);
  });
});

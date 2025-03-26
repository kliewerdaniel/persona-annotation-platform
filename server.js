// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeWebSockets } = require('./dist/lib/websocket/init');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  
  // Initialize WebSockets
  initializeWebSockets(server);
  
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});

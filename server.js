// server.js

// Install 'ws' via `npm install ws` in your project before deploying
const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

// Create WebSocket server on the given port
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});

// In-memory map of connected clients: clientId -> WebSocket
const clients = new Map();

wss.on('connection', (ws) => {
  // Generate a simple unique ID (timestamp + random) for each connecting client
  const clientId = Date.now().toString() + Math.floor(Math.random() * 1000);
  clients.set(clientId, ws);
  console.log(`Client connected: ${clientId}`);

  // Immediately send a "welcome" message so client knows its own ID
  ws.send(JSON.stringify({ type: 'welcome', clientId }));

  ws.on('message', (messageData) => {
    try {
      const msg = JSON.parse(messageData);
      // We expect messages of the form:
      // {
      //   "target": "<someClientId>",
      //   "type": "offer" | "answer" | "candidate",
      //   "data": { ... } // the actual RTC data
      // }
      const targetId = msg.target;
      if (targetId && clients.has(targetId)) {
        // Relay this message to the target client
        const targetSocket = clients.get(targetId);
        targetSocket.send(
          JSON.stringify({
            from: clientId,   // who sent it
            type: msg.type,   // "offer" | "answer" | "candidate"
            data: msg.data,   // the actual RTC data
          })
        );
      }
    } catch (err) {
      console.error("Failed to parse client message:", err);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });
});

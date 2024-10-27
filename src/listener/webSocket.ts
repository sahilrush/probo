import express, { Request, Response } from 'express';
import http from 'http';
import WebSocket from 'ws';

const app = express();
const PORT = process.env.PORT || 8080;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Stores clients for each room
const rooms = new Map<string, Set<WebSocket>>();

const joinRoom = (room: string, ws: WebSocket): void => {
  if (!rooms.has(room)) {
    rooms.set(room, new Set<WebSocket>());
  }
  rooms.get(room)?.add(ws);
};


const broadcastMessage = (room: string, message: string): void => {
  const clients = rooms.get(room);
  clients?.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle HTTP to WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

// Define the structure of incoming WebSocket messages
interface WsData {
  event: 'joinRoom' | 'message';
  room?: string;
  message?: string;
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established.');

  ws.on('message', (data) => {
    try {
      const { event, room, message }: WsData = JSON.parse(data.toString());

      if (event === 'joinRoom' && room) {
        joinRoom(room, ws);
        console.log(`User joined room: ${room}`);
        ws.send(`You have joined room: ${room}`);
      } else if (event === 'message' && room && message) {
        broadcastMessage(room, message);
        ws.send(`Message "${message}" sent to room: ${room}`);
      } else {
        ws.send('Invalid event or missing room/message data.');
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
      ws.send('Error: Invalid message format.');
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    // Remove client from any rooms
    rooms.forEach((clients, room) => {
      clients.delete(ws);
      if (clients.size === 0) {
        rooms.delete(room); // Delete room if empty
      }
    });
    console.log('WebSocket connection closed.');
  });
});

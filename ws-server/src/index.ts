import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import app from "./app"; // assuming `app` is your Express application
import Redis from "ioredis";


const PORT = process.env.PORT || 8000;
const server = http.createServer(app); // Create an HTTP server instance with the Express app
const wss = new WebSocketServer({ server }); // Pass the HTTP server to WebSocketServer

const rooms = new Map<string, Set<WebSocket>>(); // Store room clients
export const redis = new Redis({ port: 6379, host: "localhost" });


const joinRoom = (room: string, ws: WebSocket) => {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);
};

export const broadCastMessage = (room: string, message: string) => {
  const clients = rooms.get(room);
  if (clients) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

// Start listening on the HTTP server
server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

interface WsData {
  event: "joinRoom" | "message";
  room?: string;
  message?: string;
}

wss.on("connection", (ws) => {
  console.log("New WebSocket connection!");

  ws.on("message", (data) => {
    try {
      const { event, room, message }: WsData = JSON.parse(data.toString());

      if (event === "joinRoom" && room) {
        joinRoom(room, ws);
        console.log(`User joined room: ${room}`);
        ws.send(`Joined ${room}`);
      } else {
        ws.send("Error: Invalid event or missing room/message data.");
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
      ws.send("Error: Invalid message format.");
    }
  });

  ws.on("close", () => {
    rooms.forEach((clients, room) => {
      clients.delete(ws);
      if (clients.size === 0) rooms.delete(room); // Delete empty room
    });
    console.log("WebSocket connection closed.");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});









// const broadcastOrderBook = (orderBook) => {
//   wss.clients.forEach(client => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify({ type: 'ORDER_BOOK_UPDATE', orderBook }));
//     }
//   });
// };

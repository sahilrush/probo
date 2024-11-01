import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import Redis from "ioredis";
import express from "express"

const app = express


export const redis = new Redis({
  port:6379,
  host:"localhost"
})
export const subscriber =  new Redis({ port: 6379, host: "localhost" });


const PORT = process.env.PORT || 8000;
const server = http.createServer(app); // Create an HTTP server instance with the Express app
const wss = new WebSocketServer({ server }); // Pass the HTTP server to WebSocketServer

const rooms = new Map<string, Set<WebSocket>>(); // Store room clients


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
server.listen(PORT, async() => {
  console.log(`Server running at port ${PORT}`);
  await subscriber.subscribe("MESSAGE")
});
subscriber.on("message",(channel,message)=>{
    if(channel==="MESSAGE"){
      const {room,data} = JSON.parse(message)
      broadCastMessage(room,data)
    }
})
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

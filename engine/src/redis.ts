
// import { createClient } from "redis";
// import { WebSocketServer } from "ws"; // or import { Server } from "socket.io" if using Socket.IO

// // Initialize Redis clients for publishing and subscribing
// const redisPublisher = createClient();
// const redisSubscriber = createClient();

// // Connect both clients
// await redisPublisher.connect();
// await redisSubscriber.connect();

// // Handle connection errors
// redisPublisher.on("error", (err) => console.error("Redis Publisher Error:", err));
// redisSubscriber.on("error", (err) => console.error("Redis Subscriber Error:", err));

// // Set up WebSocket server
// const wss = new WebSocketServer({ server }); // Replace with Socket.IO if used

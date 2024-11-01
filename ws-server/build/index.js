"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadCastMessage = exports.subscriber = exports.redis = void 0;
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const ioredis_1 = __importDefault(require("ioredis"));
const express_1 = __importDefault(require("express"));
const app = express_1.default;
exports.redis = new ioredis_1.default({
    port: 6379,
    host: "localhost"
});
exports.subscriber = new ioredis_1.default({ port: 6379, host: "localhost" });
const PORT = process.env.PORT || 8000;
const server = http_1.default.createServer(app); // Create an HTTP server instance with the Express app
const wss = new ws_1.WebSocketServer({ server }); // Pass the HTTP server to WebSocketServer
const rooms = new Map(); // Store room clients
const joinRoom = (room, ws) => {
    if (!rooms.has(room))
        rooms.set(room, new Set());
    rooms.get(room).add(ws);
};
const broadCastMessage = (room, message) => {
    const clients = rooms.get(room);
    if (clients) {
        clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
};
exports.broadCastMessage = broadCastMessage;
// Start listening on the HTTP server
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server running at port ${PORT}`);
    yield exports.subscriber.subscribe("MESSAGE");
}));
exports.subscriber.on("message", (channel, message) => {
    if (channel === "MESSAGE") {
        const { room, data } = JSON.parse(message);
        (0, exports.broadCastMessage)(room, data);
    }
});
wss.on("connection", (ws) => {
    console.log("New WebSocket connection!");
    ws.on("message", (data) => {
        try {
            const { event, room, message } = JSON.parse(data.toString());
            if (event === "joinRoom" && room) {
                joinRoom(room, ws);
                console.log(`User joined room: ${room}`);
                ws.send(`Joined ${room}`);
            }
            else {
                ws.send("Error: Invalid event or missing room/message data.");
            }
        }
        catch (error) {
            console.error("Failed to parse message:", error);
            ws.send("Error: Invalid message format.");
        }
    });
    ws.on("close", () => {
        rooms.forEach((clients, room) => {
            clients.delete(ws);
            if (clients.size === 0)
                rooms.delete(room); // Delete empty room
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

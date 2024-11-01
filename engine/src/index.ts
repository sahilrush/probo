import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import app from "./app";
import Redis from "ioredis";
import { createUser } from "./actions/user";


const PORT = process.env.PORT || 8000;
const server = http.createServer(app); 

export const redis = new Redis({ port: 6379, host: "localhost" });



// Start listening on the HTTP server
server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

interface WsData {
  event: "joinRoom" | "message";
  room?: string;
  message?: string;
}
const pollQueue = async()=>{
    while(true){
      const message = await redis.rpop("messageQueue")
      if(message){
        const parsedMessage =JSON.parse(message)
        const {eventId,endpoint,data} = parsedMessage
        switch(endpoint){
          case "CREATE_USER": 
            createUser(data,eventId)
            break;
          case "":
        }

      }
      setTimeout(()=>{},1000)
    }
}








// const broadcastOrderBook = (orderBook) => {
//   wss.clients.forEach(client => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify({ type: 'ORDER_BOOK_UPDATE', orderBook }));
//     }
//   });
// };

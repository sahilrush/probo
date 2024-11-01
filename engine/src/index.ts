import http from "http";
import Redis from "ioredis";
import { createUser } from "./actions/user";
import express from "express";
import { onrampInr } from "./actions/onramp";
import { getBalance, getBalanceAll, getStockBalance, getStockBalanceAll } from "./actions/balance";
import { getOrderBook } from "./actions/createSymbol";

const app = express();
const PORT = process.env.PORT || 8069;
const server = http.createServer(app); 

export const redis = new Redis({ port: 6379, host: "localhost" });

server.listen(PORT, () => {
  pollQueue();
  console.log(`Server running at port ${PORT}`);
});

const pollQueue = async () => {
  while (true) {
    const message = await redis.rpop("messageQueue");

    if (message) {
      console.log(message);
      const parsedMessage = JSON.parse(message);
      const { eventId, endPoint, data } = parsedMessage;

      switch (endPoint) {
        case "CREATE_USER": 
          createUser(data, eventId);
          break;
        case "ON_RAMP":
          onrampInr(data, eventId);
          break;
        case "INR_balance":
          getBalance(data, eventId);
          break;
        case "All_INR_balance":
          getBalanceAll(data);
          console.log(data)
          break;
        case "GET_STOCK_BY":
          getStockBalance(data, eventId);
          break;
        case "ALL_stock_balance":
          getStockBalanceAll(data);
          break;
          case "ORDER_BOOK":
            getOrderBook(data,eventId)
        default:
          console.warn(`Unknown endpoint: ${endPoint}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

import express from "express";
import { buyStock,cancelOrder,sellStock, settleMarket,createMarket} from "../controller/order";

export const orderRouter = express.Router();

orderRouter.post("/buy", buyStock);
orderRouter.post("/sell", sellStock);
orderRouter.post("/market/settle",settleMarket)
orderRouter.post("/order/cancel/",cancelOrder)
orderRouter.post("/market/create/",createMarket)

import express from "express";
import { buyStock, cancelOrder, createMarket, sellStock, settleMarket } from "../actions/order";

export const orderRouter = express.Router();

orderRouter.post("/buy", buyStock);
orderRouter.post("/sell", sellStock);
orderRouter.post("/market/settle",settleMarket)
orderRouter.post("/order/cancel/",cancelOrder)
orderRouter.post("/market/create/",createMarket)

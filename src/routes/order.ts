import express from "express"
import { onrampInr } from "../actions/onramp";
import { createBuyOrder, createSellOrder } from "../actions/order";

export const orderRoute = express.Router();

orderRoute.post("/sell/",createSellOrder);
orderRoute.post("/buy/",createBuyOrder);
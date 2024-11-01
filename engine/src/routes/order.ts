import express from "express"
import {   createBuyOrder, createSellOrder,    } from "../actions/order";

export const orderRoute = express.Router();

orderRoute.post("/buy/",createBuyOrder);
orderRoute.post("/sell/",createSellOrder)
// orderRoute.post("/buy/",createBuyOrder);
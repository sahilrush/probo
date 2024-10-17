import express from "express";
import { buyStock,endMarket,sellStock} from "../controller/order";

export const orderRouter = express.Router();

orderRouter.post("/buy", buyStock);
orderRouter.post("/sell", sellStock);
// orderRouter.post("/mint", mintTokens);
orderRouter.post("/endMarket/:marketSymbol", endMarket);
import express from "express"
import { getOrderBook } from "../actions/orderBook";
export const orderBookRouter = express.Router();
orderBookRouter.get("/",getOrderBook);

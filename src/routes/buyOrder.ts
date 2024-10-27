import express from "express"
import { placeBuyOrder } from "../actions/buyOrder";


export const buyOrderRouter = express.Router();
buyOrderRouter.post('/buyorder',placeBuyOrder)
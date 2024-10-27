import  express  from "express";
import { createStockSymbol } from "../actions/createSymbol";


export const createSymbolRouter = express.Router();
createSymbolRouter.post('/create', createStockSymbol)


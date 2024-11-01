import  express  from "express";
import { createMarket } from "../actions/createSymbol";


export const createSymbolRouter = express.Router();
createSymbolRouter.post('/create', createMarket)


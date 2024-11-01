import express,{Request} from "express";
import { pushToQueue } from "../helper/redis";

export const createSymbolRouter = express.Router();

createSymbolRouter.post("/create",(req:Request, res) => {
    try{
        pushToQueue("CREATE_STOCK",req.body, res);

    }catch (error:any) {
        res.status(500).send(error);
    }
})
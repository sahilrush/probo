import express,{Request} from "express";
import { pushToQueue } from "../helper/redis";


export const orderBookRouter = express.Router();
orderBookRouter.get("/", (req:Request, res) => {
    
    try{
        pushToQueue("ORDER_BOOK",req.body,res)

    }catch (err:any){
        res.status(500).send(err);
    }
})
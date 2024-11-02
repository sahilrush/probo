import express, {Request} from "express"
import { pushToQueue } from "../helper/redis";



export const orderRouter = express.Router();

orderRouter.post("/buy",async(req:Request,res) => {
    try{
        console.log("first")
            await  pushToQueue("BUY_ORDER",req.body,res);
        

    }catch(err:any) {
        res.status(500).send(err)
    }
})



orderRouter.post("/sell", async(req:Request,res) => {
    try{
      await  pushToQueue("SELL_ORDER", req.body,res);
    
    }catch(err) {
        res.status(500).send(err)
    }


})
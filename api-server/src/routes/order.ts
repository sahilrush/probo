import express, {Request} from "express"
import { pushToQueue } from "../helper/redis";



export const orderRouter = express.Router();

orderRouter.post("/trade/buy/",async(req:Request,res) => {
    try{
            await    pushToQueue("BUY_ORDER",req.body,res);
            res.status(200).send("Buy order queued successfully");

    }catch(err:any) {
        res.status(500).send(err)
    }
})



orderRouter.post("/trade/sell/", async(req:Request,res) => {
    try{
      await  pushToQueue("SELL_ORDER", req.body,res);
      res.status(200).send("Sell order queued successfully");
    }catch(err) {
        res.status(500).send(err)
    }


})
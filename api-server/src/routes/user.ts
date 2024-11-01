import express,{Request} from "express";
import { pushToQueue } from "../helper/redis";

export const userRouter = express.Router();

userRouter.post("/create/:userId",async(req:Request, res) => {
    try{
      const response = await pushToQueue("CREATE_USER",req.params.userId,res);
      
       
    }catch (error:any) {
        res.status(500).send(error);
    }
})


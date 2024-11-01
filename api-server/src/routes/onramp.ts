import express,{Request} from "express"
import { pushToQueue } from "../helper/redis";


export const onrampRouter = express.Router();

onrampRouter.post("/inr/",(req:Request,res) => {
    try{
                pushToQueue("ON_RAMP",req.body,res)
    }catch(err:any) {
        res.status(500).send(err)
    }
})
import {  Response,Request } from "express";
import {orderBooks} from "../db"
import { message, publishMessage } from "../utils/publisResponse";

export const getOrderBook = async(eventId:string): Promise<void>=>{
    try{
        publishMessage(message(200,"success",orderBooks),eventId)
    } catch(err:any){
        publishMessage(message(500,"An error occured", {error:err.message}), eventId)
    }
    
}
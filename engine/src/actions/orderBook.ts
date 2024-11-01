import {  Response,Request } from "express";
import {orderBooks} from "../db"

export const getOrderBook = async(req:Request,res:Response)=>{
     res.status(200).json({
        data:orderBooks
    })
    return;
}
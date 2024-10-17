import {  Response,Request } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import {ORDERBOOK} from "../db"

export const getOrderBook = catchAsync(async(req:Request,res:Response)=>{
    return sendResponse(res,200,{data:ORDERBOOK})
})
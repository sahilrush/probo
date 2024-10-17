import {  Response,Request } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import {INR_BALANCES, STOCK_BALANCES} from "../db"
import AppError from "../utils/AppError";

export const createUser = catchAsync(async(req:Request,res:Response)=>{
    const {userId} = req.params;
    if(INR_BALANCES[userId]){
        return sendResponse(res,409,{message:`User already exists`})
    }
    INR_BALANCES[userId]={balance:0,locked:0}
    return sendResponse(res,201,{message:`User ${userId} created`})
})

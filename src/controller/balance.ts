import {  Response,Request } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import {INR_BALANCES,STOCK_BALANCES} from "../db"
import AppError from "../utils/AppError";

export const getBalance = catchAsync(async(req:Request,res:Response)=>{
    const balance = INR_BALANCES;
    const userId = req.params.userId
    if(!balance[userId]){
        throw new AppError(404,"User not found")
    }
    return sendResponse(res,200,{data:balance[userId]})
})

export const getBalanceAll = catchAsync(async(req:Request,res:Response)=>{
    const balance = INR_BALANCES;
    return sendResponse(res,200,{data:balance})
})
export const getStockBalance = catchAsync(async(req:Request,res:Response)=>{
    const balance = STOCK_BALANCES;
    const userId = req.params.userId
    if(!INR_BALANCES[userId]){
        return sendResponse(res,404,{data:"User not found"})
    }
    if(!balance[userId]){
        return sendResponse(res,200,{data:{}})
    }
    return sendResponse(res,200,{data:balance[userId]})
})
export const getStockBalanceAll = catchAsync(async(req:Request,res:Response)=>{
    const balance = STOCK_BALANCES;
    
    return sendResponse(res,200,{data:balance})
})
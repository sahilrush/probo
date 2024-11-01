import { Response, Request } from "express";
import { inrBalances, stockBalances } from "../db"; 




export const getBalance = async (req:Request,res:Response):Promise<any>  => {
         const {userId} = req.params;
        try{
            if(!inrBalances[userId]) {
               return res.status(404).json({error: "User not found"})
            }
            return res.status(200).json({data : inrBalances[userId]});
        }catch(e) {
            return res.status(500).json({error:"an unexpected error occured"})
        }
}





export const getBalanceAll = async(req:Request,res:Response):Promise<any> => {
    try{
        return    res.status(200).json({data:inrBalances})
    }catch(e) {
        return res.status(500).json({
            e:"an unexpected error occured"
        })
    }
}



export const getStockBalance = async(req:Request, res:Response):Promise<any> => {
    const {userId} = req.params;

    try{
        if(!stockBalances[userId]) {
            return res.status(404).json({ e:"user not found"})
        }
        return res.status(201).json({data:stockBalances[userId]})


    }catch(e) {
        res.status(500).json({e:" invalid error occur"})
    }
}

export const getStockBalanceAll = async(req:Request,res:Response):Promise<any> => {
      try{
        return res.status(200).json({
            data:stockBalances
        })
      }catch(e) {
        res.status(500).json({ e: "an unexpected error occured"})
      }
}







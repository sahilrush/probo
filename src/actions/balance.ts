import { Response, Request } from "express";
import { inrBalances, stockBalances } from "../db"; 

export const getBalance = async (req: Request, res: Response) => {
  const { userId } = req.params; 
  try{
    if (!inrBalances[userId]) {
        res.status(404).json({error : "User not found"})
      }
    res.status(200).json({data : inrBalances[userId]});
  } catch (error) {
    res.status(500).json({error: "An unexpected error occured"})
  }
}


export const getBalanceAll = async(req:Request , res: Response) => {
    try{
        
        res.status(200).json({
            data:inrBalances
        })

    } catch(error) {
        res.status(500).json({
            error:"An unexpected error occured"
        })
    }
}



  export const getStockBalance = async(req:Request , res:Response) => {
    const {userId} = req.params;
    try{
            if(!stockBalances[userId]) {
                res.status(404).json({
                    error: "User Not Found"
                })
                 res.status(200).json({
                    data: stockBalances[userId]
                })
            }
    }catch(error) {
        res.status(500).json({
            error: "An unexpected error occured"
        })
    }
  }

export const getStockBalanceAll = async(req:Request, res:Response) => {

    try{
        res.status(200).json({
            data: stockBalances

        })
    }catch(error) {
        res.status(500).json({
            error : "An unexpected error occured"
        })
    }

}
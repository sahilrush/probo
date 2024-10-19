import { Response, Request } from "express";
import { inrBalances } from "../db";

export const onrampInr = async (req: Request, res: Response) => {
  
  const { userId, amount } = req.body;
  const balance = inrBalances;
  try{

    if(!balance[userId]) {
      res.status(404).json({
        data:"user not found"
      })
    }
    const amount_Rs = amount /100;
    if(amount_Rs < 0){
      res.status(400).json({
        error:"Invaid amount"
      })
    }
    balance[userId].balance += amount;
    res.status(200).json({
      message: `${amount_Rs} added succesfully`,
      data: balance[userId]
    })
  } catch(error) {
    res.status(404).json({
      error:"internal error occured"
    })
  }
};

import { Response, Request } from "express";
import { inrBalances } from "../db";






export const onrampInr = async(req:Request,res:Response): Promise<any>=> {
  const {userId, amount} = req.body;
  const balance = inrBalances;


  try{
    if(!balance[userId]) {
       return res.status(404).json({
        data:"user not found"
      })
    }
    const amount_Rs = amount/100;

    if(amount_Rs<0) {
     return  res.status(400).json({ error:"invalid amount"})
    }
    balance[userId].balance +=amount;
   return res.status(200).json({ message:`${amount_Rs} addded succesfully`, data:balance[userId]})


  }catch(e) {
   return res.status(200).json({e:"invalid error occured"})
    
  }
}

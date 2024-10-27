
import { Response, Request } from "express";
import { inrBalances } from "../db";

 export const createUser = async(req:Request,res:Response):Promise<any> => {
  try{
    const {userId} = req.params;

    if(inrBalances[userId]) {
      return res.status(409).json({ message:"user already exist"});
    }
    inrBalances[userId] = {balance:0, locked: 0};
      return res.status(201).json({message:  `user ${userId} created`});
  }catch(error) {
    res.status(500).json({ message: "Internal server error"})
  }
 }





import { Response, Request } from "express";
import { inrBalances, stockBalances } from "../db"; 
import { publishMessage,message } from "../utils/publisResponse";




export const getBalance = async (eventId:string, userId:string):Promise<any>  => {
        try{
            if(!inrBalances[userId]) {
               return publishMessage(message(404,`${userId} does not exists`, null),eventId);

            }
               publishMessage(message(200,"success",inrBalances[userId]),eventId)

        }catch(err:any) {
            console.log(err)
        
        }
}

export const getBalanceAll = async(eventId:string):Promise<any> => {
    try{
        publishMessage(message(200,"Success", inrBalances),eventId)
    }catch(e:any) {
        console.log(e)
        }
}



export const getStockBalance = async(userId:string, eventId:string):Promise<any> => {
        try{
            if(!stockBalances[userId]){
                return publishMessage(message(404,`${userId} does not exists`, null),eventId)
            }
            publishMessage(message(200,"success",stockBalances[userId]),eventId)

        }catch(err:any){
    console.log(err)
        }}



export const getStockBalanceAll = async(eventId:string):Promise<any> => {

        try{
          publishMessage(message(200,"success",stockBalances),eventId)
        }catch(err:any){
            console.log(err)
        }
}







import { inrBalances, stockBalances } from "../db"; 
import { publishMessage, message } from "../utils/publisResponse";

export const getBalance = async (eventId: string, userId: string): Promise<any> => {
    try {
        if (!inrBalances[userId]) {
            console.log(`User ${userId} does not exist`);
            console.log(inrBalances);   

           await publishMessage(message(404, `${userId} does not exist`, null), eventId);
            return; // Return early if the user doesn't exist
        }
      await  publishMessage(message(200, "success", inrBalances[userId]), eventId);
    } catch (err: any) {
        console.error(`Error in getBalance for user ${userId}:`, err);
    }
};


export const getBalanceAll = async (eventId: string): Promise<any> => {
    try {
       await publishMessage(message(200, "Success", inrBalances), eventId);
    } catch (err: any) {
        console.error("Error in getBalanceAll:", err);
    }
};

export const getStockBalance = async (userId: string, eventId: string): Promise<any> => {
    try {
        if (!stockBalances[userId]) {
            return publishMessage(message(404, `${userId} does not exist`, null), eventId);
        }
        publishMessage(message(200, "success", stockBalances[userId]), eventId);
    } catch (err: any) {
        console.error(`Error in getStockBalance for user ${userId}:`, err);
    }
};

export const getStockBalanceAll = async (eventId: string): Promise<any> => {
    try {
        publishMessage(message(200, "success", stockBalances), eventId);
    } catch (err: any) {
        console.error("Error in getStockBalanceAll:", err);
    }
};

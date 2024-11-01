import { inrBalances } from "../db";
import { message, publishMessage } from "../utils/publisResponse";




export const onrampInr = async (data: { userId:string, amount:number }, eventId:string):Promise<any> => {
  try {
    const  {userId, amount} = data;
    console.log(`On ramping  rs ${amount} to user ${userId}`)
    if (!inrBalances[userId]) {
      return publishMessage(message(200,`${userId} does not existss` ,null),eventId)
    }
    inrBalances[userId].balance+=amount;
    publishMessage(message(200,"succesfully onRamped "+amount,inrBalances[userId]),eventId)

  }catch(err:any) {
    publishMessage(message(404, "an error occured", {error:err.message}),eventId)
  }
}
















//     // Convert amount to rupees and validate
//     const amountInRupees = amount / 100;
//     if (amountInRupees < 0) {
//       await publishMessage(
//         {
//           statusCode: 400,
//           message: "Invalid amount",
//           data: null
//         },
//         eventId
//       );
//       return;
//     }

//     // Update balance
//     inrBalances[userId].balance += amount;

//     // Publish success  response
//     await publishMessage(
//       {
//         statusCode: 200,
//         message: `₹${amountInRupees} added successfully`,
//         data: inrBalances[userId]
//       },
//       eventId
//     );
//   } catch (error) {
//     // Handle errors
//     const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
//     await publishMessage(
//       {
//         statusCode: 500,
//         message: errorMessage,
//         data: null
//       },
//       eventId
//     );
//   }
// };
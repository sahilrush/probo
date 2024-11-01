import { inrBalances } from "../db";
import { publishMessage } from "../utils/publisResponse";

interface OnrampRequest {
  userId: string;
  amount: number;
}

// interface ApiResponse {
//   statusCode: number;
//   message: string;
//   data: {
//     balance: number;
//     locked: number;
//   } | null;
// }

export const onrampInr = async (
  { userId, amount }: OnrampRequest,
  eventId: string
): Promise<void> => {
  try {
    // Validate inputs
    if (!userId || amount === undefined) {
      throw new Error('Missing required parameters');
    }

    // Check if user exists
    if (!inrBalances[userId]) {
      await publishMessage(
        {
          statusCode: 404,
          message: "User not found",
          data: null
        },
        eventId
      );
      return;
    }

    // Convert amount to rupees and validate
    const amountInRupees = amount / 100;
    if (amountInRupees < 0) {
      await publishMessage(
        {
          statusCode: 400,
          message: "Invalid amount",
          data: null
        },
        eventId
      );
      return;
    }

    // Update balance
    inrBalances[userId].balance += amount;

    // Publish success response
    await publishMessage(
      {
        statusCode: 200,
        message: `₹${amountInRupees} added successfully`,
        data: inrBalances[userId]
      },
      eventId
    );
  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    await publishMessage(
      {
        statusCode: 500,
        message: errorMessage,
        data: null
      },
      eventId
    );
  }
};
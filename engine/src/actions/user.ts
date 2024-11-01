import { inrBalances } from "../db";
import { publishMessage } from "../utils/publisResponse";

interface Balance {
  balance: number;
  locked: number;
}


export const createUser = async (userId: string, eventId: string): Promise<void> => {
  try {
    // Validate inputs
    if (!userId || !eventId) {
      throw new Error('Missing required parameters');
    }

    // Check if user already exists
    if (inrBalances[userId]) {
      await publishMessage(
        {
          statusCode: 409,
          message: "User already exists",
          data: null
        },
        eventId
      );
      return;
    }

    // Create new user with initial balance
    const newBalance: Balance = { balance: 0, locked: 0 };
    inrBalances[userId] = newBalance;

    // Publish success response
    await publishMessage(
      {
        statusCode: 201,
        message: "User created successfully",
        data: newBalance
      },
      eventId
    );
  } catch (error) {
    // Handle specific errors
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
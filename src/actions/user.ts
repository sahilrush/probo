import { Response, Request } from "express";
import { inrBalances } from "../db";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user already exists
    if (inrBalances[userId]) {
       res.status(409).json({ message: `User already exists` });
    }

    // Create a new user with initial balance and locked amounts
    inrBalances[userId] = { balance: 0, locked: 0 };

    // Respond with success message
     res.status(201).json({ message: `User ${userId} created` });
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error creating user:", error);
     res.status(500).json({ message: "Internal server error" });
  }
};


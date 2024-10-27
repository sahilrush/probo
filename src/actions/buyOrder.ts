import { Response, Request } from "express";
import { orderBook, inrBalances, stockBalances } from "../db"; // Adjust import as necessary

// Define a type for the expected request body
interface PlaceBuyOrderRequest {
  userId: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  stockType: "yes" | "no"; // Restrict stockType to "yes" or "no"
}

export const placeBuyOrder = async (req: Request<{}, {}, PlaceBuyOrderRequest>, res: Response):Promise<any> => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  try {
    // Validate the user exists
    if (!inrBalances[userId]) {
      return res.status(404).json({ error: "User not found." });
    }

    // Validate sufficient balance
    const totalCost = quantity * price;
    if (inrBalances[userId].balance < totalCost) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    // Deduct balance
    inrBalances[userId].balance -= totalCost;

    // Update stock balances
    if (!stockBalances[userId]) {
      stockBalances[userId] = {};
    }
    if (!stockBalances[userId][stockSymbol]) {
      stockBalances[userId][stockSymbol] = { yes: { quantity: 0, locked: 0 }, no: { quantity: 0, locked: 0 } };
    }

    // Update quantity for the specified stock type
    stockBalances[userId][stockSymbol][stockType].quantity += quantity;

    // Add order to order book
    if (!orderBook[stockSymbol]) {
      orderBook[stockSymbol] = { reverse: { yes: {}, no: {} }, direct: { yes: {}, no: {} } };
    }
    if (!orderBook[stockSymbol].direct[stockType][price]) {
      orderBook[stockSymbol].direct[stockType][price] = { total: 0, orders: {} };
    }

    // Update order book
    orderBook[stockSymbol].direct[stockType][price].total += quantity;
    orderBook[stockSymbol].direct[stockType][price].orders[userId] = (orderBook[stockSymbol].direct[stockType][price].orders[userId] || 0) + quantity;

    // Respond with success message
    res.status(201).json({ message: "Buy order placed successfully." });
  } catch (error) {
    console.error("Error placing buy order:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

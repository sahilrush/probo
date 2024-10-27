import { Response, Request } from "express";
import { currentMarketPrice, stockSymbols } from "../db"; // Assuming db is where your in-memory data is stored

export const createStockSymbol = async (req: Request, res: Response):Promise<any> => {
  const { stockSymbol, title, description } = req.body;

  try {
    // Check if stock symbol already exists
    if (stockSymbols[stockSymbol]) {
      return res.status(409).json({ error: "Stock symbol already exists." });
    }

    // Create new stock symbol entry
    stockSymbols[stockSymbol] = {
      stockSymbol,
      title,
      description,
    };

    // Initialize market prices for the new stock symbol
    // Assuming initial prices can be set to 0
    currentMarketPrice[stockSymbol] = { yes: 0, no: 0 };

    // Respond with success message
    res.status(201).json({ message: `Stock symbol ${stockSymbol} created successfully.` });
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error creating stock symbol:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

import { Response, Request } from "express";
import { ORDERBOOK } from "../db/types";
import { inrBalances, orderBook, stockBalances } from "../db";

// Define a type for the request body of buy/sell orders
interface PlaceOrderRequest {
  userId: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  stockType: "yes" | "no";
  orderType?: "regular" | "minted";
}

/** 
 * Sell Order Function 
 */
export const createSellOrder = async (req: Request<{}, {}, PlaceOrderRequest>, res: Response): Promise<any> => {
    const { userId, stockSymbol, quantity, price, stockType } = req.body;
  
    try {
        // Validate input parameters
        if (!userId || !stockSymbol || quantity <= 0 || price <= 0 || !stockType) {
            return res.status(400).json({ error: "All fields must be provided and valid." });
        }

        // Validate that user exists in inrBalances
        if (!inrBalances[userId]) {
            return res.status(404).json({ error: "User not found." });
        }

        // Initialize stock balances if they don't exist
        if (!stockBalances[userId]) {
            stockBalances[userId] = {};
        }
        if (!stockBalances[userId][stockSymbol]) {
            stockBalances[userId][stockSymbol] = {
                yes: { quantity: 0, locked: 0 },
                no: { quantity: 0, locked: 0 }
            };
        }

        // Get the user's stock for the specified stock symbol and type
        const userStock = stockBalances[userId][stockSymbol][stockType];

        // Check if the user has sufficient stock balance
        if (userStock.quantity < quantity) {
            return res.status(400).json({ 
                error: "Insufficient stock balance.",
                available: userStock.quantity,
                requested: quantity
            });
        }

        // Update stock balances and lock the balance for the sell order
        userStock.quantity -= quantity;
        userStock.locked += quantity;

        // Initialize order book structure if it doesn't exist
        if (!orderBook[stockSymbol]) {
            orderBook[stockSymbol] = { yes: {}, no: {} };
        }
        if (!orderBook[stockSymbol][stockType][price]) {
            orderBook[stockSymbol][stockType][price] = { total: 0, orders: {} };
        }

        // Add order to order book
        orderBook[stockSymbol][stockType][price].total += quantity;
        orderBook[stockSymbol][stockType][price].orders[userId] = 
            (orderBook[stockSymbol][stockType][price].orders[userId] || 0) + quantity;

        // Respond with success message and updated balances
        res.status(201).json({ 
            message: "Sell order placed successfully.",
            updatedBalance: {
                stock: userStock.quantity,
                locked: userStock.locked
            }
        });
    } catch (error) {
        console.error("Error creating sell order:", error);
        // Rollback changes if any error occurs
        if (stockBalances[userId]?.[stockSymbol]?.[stockType]) {
            const userStock = stockBalances[userId][stockSymbol][stockType];
            userStock.quantity += quantity;
            userStock.locked -= quantity;
        }
        res.status(500).json({ error: "Internal server error." });
    }
};

/** 
 * Buy Order Function 
 */
export const createBuyOrder = async (req: Request<{}, {}, PlaceOrderRequest>, res: Response): Promise<any> => {
    const { userId, stockSymbol, quantity, price, stockType, orderType = "regular" } = req.body;

    const totalCost = quantity * price;
    try {
        // Validate input parameters
        if (!userId || !stockSymbol || quantity <= 0 || price <= 0 || !stockType) {
            return res.status(400).json({ error: "All fields must be provided and valid." });
        }

        // Validate that user exists and has sufficient balance
        if (!inrBalances[userId]) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check available balance and locked amount
        const availableBalance = inrBalances[userId].balance - (inrBalances[userId].locked || 0);
        if (availableBalance < totalCost) {
            return res.status(400).json({ 
                error: "Insufficient balance.",
                available: availableBalance,
                required: totalCost
            });
        }

        // Lock the required balance
        inrBalances[userId].balance -= totalCost;
        inrBalances[userId].locked = (inrBalances[userId].locked || 0) + totalCost;

        // Initialize order book structure
        if (!orderBook[stockSymbol]) {
            orderBook[stockSymbol] = { yes: {}, no: {} };
        }

        // Handle order placement based on type
        if (orderType === "regular") {
            if (!orderBook[stockSymbol][stockType][price]) {
                orderBook[stockSymbol][stockType][price] = { total: 0, orders: {} };
            }
            orderBook[stockSymbol][stockType][price].total += quantity;
            orderBook[stockSymbol][stockType][price].orders[userId] = 
                (orderBook[stockSymbol][stockType][price].orders[userId] || 0) + quantity;

        } else if (orderType === "minted") {
            // Handle Minted Buy Order with pseudo order
            if (!orderBook[stockSymbol][stockType][price]) {
                orderBook[stockSymbol][stockType][price] = { total: 0, orders: {} };
            }
            orderBook[stockSymbol][stockType][price].total += quantity;
            orderBook[stockSymbol][stockType][price].orders[userId] = 
                (orderBook[stockSymbol][stockType][price].orders[userId] || 0) + quantity;

            // Create pseudo sell order if no matching sell orders exist
            if (Object.keys(orderBook[stockSymbol][stockType]).length === 1) { // Only our buy order exists
                const pseudoPrice = price;
                if (!orderBook[stockSymbol][stockType][pseudoPrice]) {
                    orderBook[stockSymbol][stockType][pseudoPrice] = { total: 0, orders: {} };
                }
                orderBook[stockSymbol][stockType][pseudoPrice].total += quantity;
                orderBook[stockSymbol][stockType][pseudoPrice].orders["system_minted"] = 
                    (orderBook[stockSymbol][stockType][pseudoPrice].orders["system_minted"] || 0) + quantity;
            }
        }

        // Respond with success message and updated balances
        res.status(201).json({ 
            message: "Buy order placed successfully.",
            updatedBalance: {
                available: inrBalances[userId].balance,
                locked: inrBalances[userId].locked
            }
        });
    } catch (error) {
        console.error("Error creating buy order:", error);
        // Rollback changes if any error occurs
        if (inrBalances[userId]) {
            inrBalances[userId].balance += totalCost;
            inrBalances[userId].locked -= totalCost;
        }
        res.status(500).json({ error: "Internal server error." });
    }
};
import { v4 as uuidv4 } from 'uuid';
import { inrBalances, orderBooks, stockBalances, stockSymbols } from '../db';
import { OrderBook } from '../db/types'; 
import { Response ,Request} from 'express';

// Core data structures

// Initialize a new market
export const createMarket = async (req:Request,res:Response): Promise<any> => {
  const { stockSymbol, title, description } = req.body;

  try {
    // Check if market already exists
    if (stockSymbols[stockSymbol]) {
      return res.status(400).send(`Market with symbol ${stockSymbol} already exists`)
      
    }

    // Initialize the order book structure
    const initialOrderBook: OrderBook = {
      yes: {},
      no: {}
    };

    // Store market data
    orderBooks[stockSymbol] = initialOrderBook;
    stockSymbols[stockSymbol] = {
      stockSymbol,
      title,
      description
    };
    res.status(200).send(`Successfully created market ${stockSymbol}`)
    
  } catch (error: any) {
    res.status(400).send(`Error`)

  }
};

// Initialize user balances
export const initializeUserBalance = (userId: string, initialBalance: number = 0) => {
  if (!inrBalances[userId]) {
    inrBalances[userId] = {
      balance: initialBalance,
      locked: 0
    };
  }

  if (!stockBalances[userId]) {
    stockBalances[userId] = {};
  }
};

// Initialize user stock holdings
export const initializeUserStockHolding = (userId: string, stockSymbol: string) => {
  if (!stockBalances[userId][stockSymbol]) {
    stockBalances[userId][stockSymbol] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 }
    };
  }
};

// Place a new order
export const placeOrder = (
  userId: string,
  stockSymbol: string,
  orderType: "sell" | "reversed",
  optionType: "yes" | "no",
  price: number,
  quantity: number
): boolean => {
  try {
    // Initialize user balances if they don't exist
    initializeUserBalance(userId);
    initializeUserStockHolding(userId, stockSymbol);

    const orderBook = orderBooks[stockSymbol];
    if (!orderBook) return false;

    // Validate user has sufficient balance/holdings
    if (!validateOrder(userId, stockSymbol, orderType, optionType, price, quantity)) {
      return false;
    }

    // Initialize price level if it doesn't exist
    if (!orderBook[optionType][price]) {
      orderBook[optionType][price] = {
        total: 0,
        orders: {}
      };
    }

    const orderId = uuidv4();
    const priceLevel = orderBook[optionType][price];

    // Add order to the book
    priceLevel.orders[orderId] = {
      type: orderType,
      quantity
    };
    priceLevel.total += quantity;

    // Lock appropriate assets
    if (orderType === "sell") {
      stockBalances[userId][stockSymbol][optionType].locked += quantity;
    } else { // reversed
      const lockAmount = quantity * price;
      inrBalances[userId].locked += lockAmount;
    }

    return true;
  } catch (error) {
    console.error('Error placing order:', error);
    return false;
  }
};

// Validate order before placement
const validateOrder = (
  userId: string,
  stockSymbol: string,
  orderType: "sell" | "reversed",
  optionType: "yes" | "no",
  price: number,
  quantity: number
): boolean => {
  if (orderType === "sell") {
    const availableQuantity = 
      stockBalances[userId][stockSymbol][optionType].quantity -
      stockBalances[userId][stockSymbol][optionType].locked;
    return availableQuantity >= quantity;
  } else { // reversed
    const requiredBalance = price * quantity;
    const availableBalance = inrBalances[userId].balance - inrBalances[userId].locked;
    return availableBalance >= requiredBalance;
  }
};

// Get order book for a market
export const getOrderBook = (
  stockSymbol: string,
  optionType: "yes" | "no"
): { price: number; quantity: number }[] => {
  const book = orderBooks[stockSymbol]?.[optionType] ?? {};
  
  return Object.entries(book)
    .map(([price, level]) => ({
      price: Number(price),
      quantity: level.total
    }))
    .sort((a, b) => b.price - a.price);
};

// Get user's position in a market
export const getUserPosition = (
  userId: string,
  stockSymbol: string
) => {
  initializeUserBalance(userId);
  initializeUserStockHolding(userId, stockSymbol);

  return {
    inr: inrBalances[userId],
    stock: stockBalances[userId][stockSymbol]
  };
};

// Cancel an order
export const cancelOrder = (
  userId: string,
  stockSymbol: string,
  optionType: "yes" | "no",
  price: number,
  orderId: string
): boolean => {
  try {
    const orderBook = orderBooks[stockSymbol];
    if (!orderBook?.[optionType]?.[price]?.orders[orderId]) {
      return false;
    }

    const order = orderBook[optionType][price].orders[orderId];
    const priceLevel = orderBook[optionType][price];

    // Unlock assets
    if (order.type === "sell") {
      stockBalances[userId][stockSymbol][optionType].locked -= order.quantity;
    } else {
      inrBalances[userId].locked -= order.quantity * price;
    }

    // Remove order from book
    priceLevel.total -= order.quantity;
    delete priceLevel.orders[orderId];

    // Clean up empty price levels
    if (priceLevel.total === 0) {
      delete orderBook[optionType][price];
    }

    return true;
  } catch (error) {
    console.error('Error canceling order:', error);
    return false;
  }
};
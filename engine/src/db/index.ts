import { 
  InrBalance,
  StockBalance,
  OrderBooks,
  StockSymbols,
} from './types';

// In-memory storage for INR balances of users
export const inrBalances: InrBalance = {};

// In-memory storage for stock balances of users
export const stockBalances: StockBalance = {};

// Current market prices for stock symbols
export interface MarketPrice {
  yes: number;
  no: number;
}

export interface MarketPrices {
  [stockSymbol: string]: MarketPrice;
}

export const currentMarketPrice: MarketPrices = {};

// Order book storing active orders for each stock symbol
export const orderBooks: OrderBooks = {};

// Identifier for the market maker
export const marketMakerId = 'marketMaker';

// In-memory storage for stock symbols
export const stockSymbols: StockSymbols = {};

// Helper function to initialize a new order book for a stock symbol
export function initializeOrderBook(stockSymbol: string): void {
  orderBooks[stockSymbol] = {
    yes: {},
    no: {}
  };
}

// Helper function to initialize a user's INR balance
export function initializeInrBalance(userId: string): void {
  inrBalances[userId] = {
    balance: 0,
    locked: 0
  };
}

// Helper function to initialize a user's stock balance for a symbol
export function initializeStockBalance(userId: string, stockSymbol: string): void {
  if (!stockBalances[userId]) {
    stockBalances[userId] = {};
  }
  
  stockBalances[userId][stockSymbol] = {
    yes: {
      quantity: 0,
      locked: 0
    },
    no: {
      quantity: 0,
      locked: 0
    }
  };
}

// Helper function to initialize market price for a new stock symbol
export function initializeMarketPrice(stockSymbol: string): void {
  currentMarketPrice[stockSymbol] = {
    yes: 0,
    no: 0
  };
}

// Helper function to initialize a new stock symbol
export function initializeStockSymbol(
  stockSymbol: string,
  title: string,
  description: string
): void {
  stockSymbols[stockSymbol] = {
    stockSymbol,
    title,
    description
  };
}
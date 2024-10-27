import { 
    InrBalances, 
    OrderBook, 
    StockBalances, 
    StockSymbols, // Import the StockSymbols type if needed
  } from './types';
  
  // In-memory storage for INR balances of users
  export const inrBalances: InrBalances = {};
  
  // In-memory storage for stock balances of users
  export const stockBalances: StockBalances = {};
  
  // Current market prices for stock symbols, holds prices for 'yes' and 'no'
  export const currentMarketPrice: { [stockSymbol: string]: { yes: number, no: number } } = {};
  
  // Order book storing active buy/sell orders for each stock symbol
  export const orderBook: OrderBook = {};
  
  // Identifier for the market maker
  export const marketMakerId = 'marketMaker';
  
  // In-memory storage for stock symbols
  export const stockSymbols: { [stockSymbol: string]: { 
    stockSymbol: string; 
    title: string; 
    description: string; 
  } } = {};
  
// Represents the balance of a user
export interface UserBalance {
  balance: number;  // Available balance
  locked: number;   // Amount locked in orders
}

// Maps userId to their UserBalance
export interface InrBalance {
  [userId: string]: UserBalance;
}

// Represents holdings for a specific option type (yes/no)
export interface OptionHolding {
  quantity: number;  // Quantity held
  locked: number;    // Locked quantity in orders
}

// Represents the stock balance for "yes" and "no" options
export interface StockBalance {
  [userId: string]: {
    [stockSymbol: string]: {
      yes: OptionHolding;
      no: OptionHolding;
    }
  }
}

// Represents an order in the orderbook
export interface Order {
  type: "sell" | "reversed";
  quantity: number;
}

// Represents a price level in the orderbook
export interface PriceLevel {
  total: number;
  orders: {
    [key: string]: Order;
  }
}

// Represents the complete order book structure
export interface OrderBook {
  yes: {
    [price: number]: PriceLevel;
  };
  no: {
    [price: number]: PriceLevel;
  }
}

// Represents all orderbooks for different stock symbols
export interface OrderBooks {
  [stockSymbol: string]: OrderBook;
}

// Represents a stock symbol with additional details
export interface StockSymbol {
  stockSymbol: string;
  title: string;
  description: string;
}

// Maps stockSymbol to its StockSymbol details
export interface StockSymbols {
  [stockSymbol: string]: StockSymbol;
}

export interface Market {
  stockSymbol: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
}
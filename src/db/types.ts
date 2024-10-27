// Represents the balance of a user
export interface UserBalance {
  balance: number;  // Available balance
  locked: number;   // Amount locked in orders
}

// Maps userId to their UserBalance
export interface InrBalances {
  [userId: string]: UserBalance;
}

// Represents the stock balance for "yes" and "no" options
export interface StockBalance {
  yes: {
    quantity: number;  // Quantity of "yes" options held
    locked: number;    // Locked quantity in orders
  };
  no: {
    quantity: number;  // Quantity of "no" options held
    locked: number;    // Locked quantity in orders
  };
}

// Maps userId to their StockBalance for different stock symbols
export interface StockBalances {
  [userId: string]: {
    [stockSymbol: string]: StockBalance;
  };
}

// Represents an order entry at a specific price level
export interface OrderEntry {
  total: number; // Total quantity for this price level
  orders: {
    [userId: string]: number; // UserId and quantity ordered
  };
}

// Represents the order book for trading
export const ORDERBOOK: {
  [stockSymbol: string]: {
    yes: {
      [price: string]: OrderEntry; // Price level for "yes" options
    };
    no: {
      [price: string]: OrderEntry; // Price level for "no" options
    };
  };
} = {
  "BTC_USDT_10_Oct_2024_9_30": {
    yes: {
      "9.5": {
        total: 12, // Total quantity at this price level
        orders: {
          "user1": 10, // User1 ordered 10 shares
          "user2": 2    // User2 ordered 2 shares
        }
      },
      // Additional price levels can be added here
      // "8.5": {
      //   total: 12,
      //   orders: {
      //     "user1": 3,
      //     "user2": 3,
      //     "user3": 6
      //   }
      // }
    },
    no: {
      // Price levels for "no" options will be added here
    }
  }
};

// Represents a stock symbol with additional details
export interface StockSymbol {
  stockSymbol: string; // The symbol of the stock/option
  title: string;       // A title for the stock
  description: string; // Description of the stock/option
}

// Maps stockSymbol to its StockSymbol details
export interface StockSymbols {
  [stockSymbol: string]: StockSymbol;
}

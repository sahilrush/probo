
export interface UserBalance {
    balance: number;
    locked: number;
  }
  
  export interface InrBalances {
    [userId: string]: UserBalance;
  }
  
  export interface OrderEntry {
    total: number;
    orders: {
      [userId: string]: number;
    };
  }
  
  export interface OrderBook {
    [symbol: string]: {
      yes: {
        [price: string]: OrderEntry;
      };
      no: {
        [price: string]: OrderEntry;
      };
    };
  }
  

  
  export interface StockSymbol {
    stockSymbol: string;
  }
  
  export interface StockSymbols {
    [stockSymbol: string]: StockSymbol;
  }
  
  export interface StockBalance {
    yes: {
      quantity: number;
      locked: number;
    };
    no: {
      quantity: number;
      locked: number;
    };
  }
  
  export interface StockBalances {
    [userId: string]: {
      [stockSymbol: string]: StockBalance;
    };
  }
  
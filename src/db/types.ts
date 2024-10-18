
export interface UserBalance {
  balance: number; 
  locked: number; 
}

export interface InrBalances {
  [userId: string]: UserBalance;
}

export interface OrderEntry {
  orderId: string;
  userId: string;
  quantity: number;
  price: number;     
  orderType: 'buy' | 'sell';
}

export interface OrderBookEntry {
  total: number;     
  orders: OrderEntry[];
}

export interface OrderBookSide {
  [price: string]: OrderBookEntry; 
}

export interface OrderBookStockType {
  buy: OrderBookSide;
  sell: OrderBookSide;
}

export interface OrderBook {
  [stockSymbol: string]: {
    yes: OrderBookStockType;
    no: OrderBookStockType;
  };
}

export interface StockBalanceEntry {
  quantity: number;
  locked: number;
}

export interface StockBalance {
  yes?: StockBalanceEntry;
  no?: StockBalanceEntry;
}

export interface StockBalances {
  [userId: string]: {
    [stockSymbol: string]: StockBalance;
  };
}

export interface Market {
  stockSymbol: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  initialYesTokens: number;
  initialNoTokens: number;
  result?: 'yes' | 'no';
}
export interface MintEntry {
  user: string;
  quantity: number;
  type: "yes" | "no";
}

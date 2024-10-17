import { Request, Response } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import { INR_BALANCES, ORDERBOOK, STOCK_BALANCES } from "../db";

const proboId = process.env.PROBO_USER_ID||"prober";

interface MintParticipant {
  user: string;
  stockType: "yes" | "no";
  qty: number;
}

interface MintList {
  participants: MintParticipant[];
  isComplete: boolean;
}

interface MarketInfo {
  startTime: number;
  endTime: number;
  result?: "yes" | "no";
}

const BUY_ORDERS: {
  [symbol: string]: {
    [price: number]: {
      [userId: string]: {
        quantity: number;
        stockType: "yes" | "no";
      };
    };
  };
} = {};

const LOCKED_AMOUNTS: {
  [symbol: string]: {
    [userId: string]: {
      [stockType: string]: {
        quantity: number;
        amount: number;
      };
    };
  };
} = {};


const MINT_LISTS: { [symbol: string]: MintList[] } = {};

const MARKET_INFO: { [symbol: string]: MarketInfo } = {};

function isMarketOpen(symbol: string): boolean {
  const now = Date.now();
  console.log(MARKET_INFO)
  console.log(symbol)
  console.log(MARKET_INFO[symbol])
  return MARKET_INFO[symbol] && now >= MARKET_INFO[symbol].startTime && now < MARKET_INFO[symbol].endTime;
}





export const buyStock = catchAsync(async (req: Request, res: Response) => {
  const {
    userId,
    stockSymbol,
    quantity,
    price,
    stockType,
  }: {
    userId: string;
    stockSymbol: string;
    quantity: number;
    price: number;
    stockType: "yes" | "no";
  } = req.body;

  if (!isMarketOpen(stockSymbol)) {
    return sendResponse(res, 400, { message: "Market is closed" });
  }
  const totalCost = quantity * price;

  if (!INR_BALANCES[userId]) {
    return sendResponse(res, 404, { message: "User not found" });
  }
  if (!ORDERBOOK[stockSymbol]) {
    return sendResponse(res, 404, { message: "Symbol not found" });
  }
  if (INR_BALANCES[userId].balance < totalCost) {
    return sendResponse(res, 400, { message: "Insufficient balance" });
  }

  if (!STOCK_BALANCES[userId]) {
    STOCK_BALANCES[userId] = {};
  }
  if (!STOCK_BALANCES[userId][stockSymbol]) {
    STOCK_BALANCES[userId][stockSymbol] = { yes: { quantity: 0, locked: 0 }, no: { quantity: 0, locked: 0 } };
  }

  let availableStocks = quantity;
  let totalTradeQty = 0;

  if (ORDERBOOK[stockSymbol][stockType][price] && ORDERBOOK[stockSymbol][stockType][price].total > 0) {
    const orders = ORDERBOOK[stockSymbol][stockType][price].orders;
    
    for (const sellerId in orders) {
      
      if (availableStocks === 0) break;
      
      const sellerQuantity = orders[sellerId];
      const tradeQuantity = Math.min(availableStocks, sellerQuantity);
      
      // Execute the trade
      totalTradeQty += tradeQuantity;
      availableStocks -= tradeQuantity;
      
      // Update seller's balances
  
      INR_BALANCES[sellerId].balance += tradeQuantity * price;
      
      STOCK_BALANCES[sellerId][stockSymbol][stockType].locked -= tradeQuantity;

      
      // Update buyer's stock balance
      STOCK_BALANCES[userId][stockSymbol][stockType].quantity += tradeQuantity;
      console.log("3")
      
      // Update orderbook
      ORDERBOOK[stockSymbol][stockType][price].total -= tradeQuantity;
      console.log("4")
      ORDERBOOK[stockSymbol][stockType][price].orders[sellerId] -= tradeQuantity;
      console.log("5")
      
      if (ORDERBOOK[stockSymbol][stockType][price].orders[sellerId] === 0) {
        console.log("6")
        delete ORDERBOOK[stockSymbol][stockType][price].orders[sellerId];
        console.log("7")
      }
    }
    
    // Remove price level if total is 0
    if (ORDERBOOK[stockSymbol][stockType][price].total === 0) {
      console.log("8")
      delete ORDERBOOK[stockSymbol][stockType][price];
    }
  }
  
  if (availableStocks > 0) {
    console.log("9")
    const oppositeType = stockType === "yes" ? "no" : "yes";
    const reversePrice = 1000 - price; // 10 rupees in paise
    
    if (!ORDERBOOK[stockSymbol][oppositeType][reversePrice]) {
      console.log("10")
      ORDERBOOK[stockSymbol][oppositeType][reversePrice] = { total: 0, orders: {} };
      console.log("11")
    }
    console.log("12")
    
    ORDERBOOK[stockSymbol][oppositeType][reversePrice].total += availableStocks;
    console.log("13")
    ORDERBOOK[stockSymbol][oppositeType][reversePrice].orders[proboId] = 

    (ORDERBOOK[stockSymbol][oppositeType][reversePrice].orders[proboId] || 0) + availableStocks;
    console.log("14")
    
    // Lock buyer's balance for remaining stocks
    const lockedAmount = availableStocks * price;
    INR_BALANCES[userId].locked += lockedAmount;
    INR_BALANCES[userId].balance -= lockedAmount;
    console.log("15")
    STOCK_BALANCES[userId][stockSymbol][stockType].locked += availableStocks;
    console.log("16")
    
    // Record the locked amount
    if (!LOCKED_AMOUNTS[stockSymbol]) {
      LOCKED_AMOUNTS[stockSymbol] = {};
    }
    if (!LOCKED_AMOUNTS[stockSymbol][userId]) {
      LOCKED_AMOUNTS[stockSymbol][userId] = {};
    }
    if (!LOCKED_AMOUNTS[stockSymbol][userId][stockType]) {
      LOCKED_AMOUNTS[stockSymbol][userId][stockType] = { quantity: 0, amount: 0 };
    }
    console.log("17")
    LOCKED_AMOUNTS[stockSymbol][userId][stockType].quantity += availableStocks;
    console.log("18")
    LOCKED_AMOUNTS[stockSymbol][userId][stockType].amount += lockedAmount;
    console.log("19")
    
    // Create or update probo's balance
    if (!INR_BALANCES[proboId]) {
      console.log("20")
      INR_BALANCES[proboId] = { balance: 0, locked: 0 };
    }
    INR_BALANCES[proboId].locked += availableStocks * reversePrice;
    console.log("21")
    
    // Add to BUY_ORDERS
    if (!BUY_ORDERS[stockSymbol]) {
      console.log("22")
      BUY_ORDERS[stockSymbol] = {};
    }
    if (!BUY_ORDERS[stockSymbol][price]) {
      console.log("23")
      BUY_ORDERS[stockSymbol][price] = {};
    }
    BUY_ORDERS[stockSymbol][price][userId] = {
      quantity: availableStocks,
      stockType: stockType,
    };

    // Update or create MINT_LISTS
    if (!MINT_LISTS[stockSymbol]) {
      MINT_LISTS[stockSymbol] = [];
    }
    
    let existingMintList = MINT_LISTS[stockSymbol].find(ml => !ml.isComplete);
    if (!existingMintList) {
      existingMintList = { participants: [], isComplete: false };
      MINT_LISTS[stockSymbol].push(existingMintList);
    }
    existingMintList.participants.push({
      user: userId,
      stockType: stockType,
      qty: availableStocks,
    });

    // Check if the mint list is complete
    const totalYes = existingMintList.participants.reduce((sum, p) => p.stockType === "yes" ? sum + p.qty : sum, 0);
    const totalNo = existingMintList.participants.reduce((sum, p) => p.stockType === "no" ? sum + p.qty : sum, 0);

    if (totalYes === totalNo) {
      existingMintList.isComplete = true;
      // Process the complete mint list
      for (const participant of existingMintList.participants) {
        INR_BALANCES[participant.user].locked -= participant.qty * price;
        STOCK_BALANCES[participant.user][stockSymbol][participant.stockType].quantity += participant.qty;
        STOCK_BALANCES[participant.user][stockSymbol][participant.stockType].locked -= participant.qty;
      }
    }
  }

  // Update buyer's balance for traded stocks
  INR_BALANCES[userId].balance -= totalTradeQty * price;

  return sendResponse(res, 200, {
    message: `Order processed successfully. Bought ${totalTradeQty} stocks immediately. ${availableStocks} stocks pending.`,
    data: {
      boughtQuantity: totalTradeQty,
      pendingQuantity: availableStocks,
      updatedOrderBook: ORDERBOOK[stockSymbol],
      updatedUserBalance: INR_BALANCES[userId],
      updatedUserStockBalance: STOCK_BALANCES[userId][stockSymbol],
    },
  });
});

export const sellStock = catchAsync(async (req: Request, res: Response) => {
  const {
    userId,
    stockSymbol,
    quantity,
    price,
    stockType,
  }: {
    userId: string;
    stockSymbol: string;
    quantity: number;
    price: number;
    stockType: "yes" | "no";
  } = req.body;

  if (!isMarketOpen(stockSymbol)) {
    return sendResponse(res, 400, { message: "Market is closed" });
  }

  if (!STOCK_BALANCES[userId] || !STOCK_BALANCES[userId][stockSymbol]) {
    return sendResponse(res, 404, { message: "User or stock not found" });
  }

  const userStockBalance = STOCK_BALANCES[userId][stockSymbol][stockType];
  if (userStockBalance.quantity < quantity) {
    return sendResponse(res, 400, { message: "Insufficient stock balance" });
  }

  let remainingQuantity = quantity;
  let totalTradeQty = 0;

  // Check for matching buy orders
  if (BUY_ORDERS[stockSymbol] && BUY_ORDERS[stockSymbol][price]) {
    const buyOrders = BUY_ORDERS[stockSymbol][price];
    for (const buyerId in buyOrders) {
      if (remainingQuantity === 0) break;

      const buyOrder = buyOrders[buyerId];
      const tradeQuantity = Math.min(remainingQuantity, buyOrder.quantity);

      // Execute the trade
      totalTradeQty += tradeQuantity;
      remainingQuantity -= tradeQuantity;

      // Update seller's balances
      console.log("second")
      console.log(STOCK_BALANCES)
      STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= tradeQuantity;
      INR_BALANCES[userId].balance += tradeQuantity * price;

      // Update buyer's balances
      INR_BALANCES[buyerId].locked -= tradeQuantity * price;
      STOCK_BALANCES[buyerId][stockSymbol][buyOrder.stockType].quantity += tradeQuantity;
      STOCK_BALANCES[buyerId][stockSymbol][buyOrder.stockType].locked -= tradeQuantity;

      // Update BUY_ORDERS
      buyOrder.quantity -= tradeQuantity;
      if (buyOrder.quantity === 0) {
        delete BUY_ORDERS[stockSymbol][price][buyerId];
      }

      // Update MINT_LISTS
      const mintList = MINT_LISTS[stockSymbol].find(ml => ml.participants.some(p => p.user === buyerId));
      if (mintList) {
        const participant = mintList.participants.find(p => p.user === buyerId);
        if (participant) {
          participant.qty -= tradeQuantity;
          if (participant.qty === 0) {
            mintList.participants = mintList.participants.filter(p => p.user !== buyerId);
          }
        }
      }
    }

    // Clean up empty price levels in BUY_ORDERS
    if (Object.keys(BUY_ORDERS[stockSymbol][price]).length === 0) {
      delete BUY_ORDERS[stockSymbol][price];
    }
  }

  // If there are remaining stocks to sell, add them to the ORDERBOOK
  if (remainingQuantity > 0) {
    if (!ORDERBOOK[stockSymbol][stockType][price]) {
      ORDERBOOK[stockSymbol][stockType][price] = { total: 0, orders: {} };
    }
    ORDERBOOK[stockSymbol][stockType][price].total += remainingQuantity;
    ORDERBOOK[stockSymbol][stockType][price].orders[userId] = 
      (ORDERBOOK[stockSymbol][stockType][price].orders[userId] || 0) + remainingQuantity;

      // Record the locked amount
      if (!LOCKED_AMOUNTS[stockSymbol]) {
        LOCKED_AMOUNTS[stockSymbol] = {};
      }
      if (!LOCKED_AMOUNTS[stockSymbol][userId]) {
        LOCKED_AMOUNTS[stockSymbol][userId] = {};
      }
      if (!LOCKED_AMOUNTS[stockSymbol][userId][stockType]) {
        LOCKED_AMOUNTS[stockSymbol][userId][stockType] = { quantity: 0, amount: 0 };
      }
      LOCKED_AMOUNTS[stockSymbol][userId][stockType].quantity += remainingQuantity;
      // For sell orders, we don't lock an amount, but we can set it to 0 for consistency
      LOCKED_AMOUNTS[stockSymbol][userId][stockType].amount += 0;
  }

  return sendResponse(res, 200, {
    message: `Order processed successfully. Sold ${totalTradeQty} stocks immediately. ${remainingQuantity} stocks added to order book.`,
    data: {
      soldQuantity: totalTradeQty,
      pendingQuantity: remainingQuantity,
      updatedOrderBook: ORDERBOOK[stockSymbol],
      updatedUserBalance: INR_BALANCES[userId],
      updatedUserStockBalance: STOCK_BALANCES[userId][stockSymbol],
    },
  });
});

export const endMarket = catchAsync(async (req: Request, res: Response) => {
  const { stockSymbol, result }: { stockSymbol: string; result: "yes" | "no" } = req.body;

  if (!MARKET_INFO[stockSymbol]) {
    return sendResponse(res, 404, { message: "Market not found" });
  }

  // if (Date.now() < MARKET_INFO[stockSymbol].endTime) {
  //   return sendResponse(res, 400, { message: "Market has not ended yet" });
  // }

  MARKET_INFO[stockSymbol].result = result;
    refundLockedStocks(stockSymbol);

    // Settle the market
    settleMarket(stockSymbol);

    return sendResponse(res, 200, {
      message: `Market ${stockSymbol} has been settled with result: ${result}`,
      data: {
        marketInfo: MARKET_INFO[stockSymbol],
      },
    });
  
});

export const createMarket = catchAsync(async (req: Request, res: Response) => {
  const { stockSymbol, startTime, endTime }: { stockSymbol: string; startTime: number; endTime: number } = req.body;

  if (MARKET_INFO[stockSymbol]) {
    return sendResponse(res, 400, { message: "Market already exists" });
  }

  MARKET_INFO[stockSymbol] = {
    startTime,
    endTime
  };
  

  ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
  BUY_ORDERS[stockSymbol] = {};
  MINT_LISTS[stockSymbol] = [];

  return sendResponse(res, 200, {
    message: `Market ${stockSymbol} has been created`,
    data: {
      marketInfo: MARKET_INFO[stockSymbol],
    },
  });
});

export const getMarketStatus = catchAsync(async (req: Request, res: Response) => {
  const { stockSymbol } = req.params;

  if (!MARKET_INFO[stockSymbol]) {
    return sendResponse(res, 404, { message: "Market not found" });
  }

  const now = Date.now();
  let status: "not started" | "open" | "closed" | "settled";

  if (now < MARKET_INFO[stockSymbol].startTime) {
    status = "not started";
  } else if (now >= MARKET_INFO[stockSymbol].startTime && now < MARKET_INFO[stockSymbol].endTime) {
    status = "open";
  } else if (now >= MARKET_INFO[stockSymbol].endTime && !MARKET_INFO[stockSymbol].result) {
    status = "closed";
  } else {
    status = "settled";
  }

  return sendResponse(res, 200, {
    data: {
      stockSymbol,
      status,
      marketInfo: MARKET_INFO[stockSymbol],
    },
  });
});

// Helper function to convert rupees to paise
function rupeeToePaise(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to convert paise to rupees
function paiseToRupee(amount: number): number {
  return amount / 100;
}

function refundLockedStocks(symbol: string) {
  if (!LOCKED_AMOUNTS[symbol]) return;

  for (const userId in LOCKED_AMOUNTS[symbol]) {
    for (const stockType in LOCKED_AMOUNTS[symbol][userId]) {
      const { quantity, amount } = LOCKED_AMOUNTS[symbol][userId][stockType];
      if (quantity > 0) {
        // Refund the original locked amount
        INR_BALANCES[userId].balance += amount;
        INR_BALANCES[userId].locked -= amount;

        // Reset locked stocks
        if(stockType==="no"){
          STOCK_BALANCES[userId][symbol]["no"].locked -= quantity;
        }
        else{
          STOCK_BALANCES[userId][symbol]["yes"].locked -= quantity;
        }

        // Clear the locked amount record
        LOCKED_AMOUNTS[symbol][userId][stockType] = { quantity: 0, amount: 0 };
      }
    }
  }

  // Clean up the LOCKED_AMOUNTS data structure
  delete LOCKED_AMOUNTS[symbol];
}


// Update the settleMarket function to use paise
function settleMarket(symbol: string) {
  const marketInfo = MARKET_INFO[symbol];
  if (!marketInfo || !marketInfo.result) {
    throw new Error("Market result not available");
  }

  for (const userId in STOCK_BALANCES) {
    if (STOCK_BALANCES[userId][symbol]) {
      const winningStockQuantity = STOCK_BALANCES[userId][symbol][marketInfo.result].quantity;
      const settlementAmount = winningStockQuantity * rupeeToePaise(10); // 10 rupees in paise
      INR_BALANCES[userId].balance += settlementAmount;

      // Reset stock balances
      STOCK_BALANCES[userId][symbol] = { yes: { quantity: 0, locked: 0 }, no: { quantity: 0, locked: 0 } };
    }
  }

  // Clear orderbook and buy orders for this symbol
  delete ORDERBOOK[symbol];
  delete BUY_ORDERS[symbol];
  delete MINT_LISTS[symbol];
  delete LOCKED_AMOUNTS[symbol];

}


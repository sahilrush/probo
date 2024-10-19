import {
  stockBalances,
  inrBalances,
  orderBook,
  lastTradedPrices,
  marketMakerId,
  markets,
} from "../db/index";
import { Request, Response } from "express";

const MARKET_INFO: { [symbol: string]: Market } = {};
function executeTrade(
  buyerId: string,
  sellerId: string,
  stockSymbol: string,
  quantity: number,
  price: number,
  stockType: "yes" | "no"
) {
  const totalPrice = quantity * price;

  // Ensure buyer's INR balance is unlocked
  if (!inrBalances[buyerId]) {
    inrBalances[buyerId] = { balance: 0, locked: 0 };
  }
  inrBalances[buyerId].locked -= totalPrice;

  // Update seller's INR balance
  if (!inrBalances[sellerId]) {
    inrBalances[sellerId] = { balance: 0, locked: 0 };
  }
  inrBalances[sellerId].balance += totalPrice;

  // Initialize buyer's stock balance structure if not defined
  if (!stockBalances[buyerId]) {
    stockBalances[buyerId] = {};
  }
  if (!stockBalances[buyerId][stockSymbol]) {
    stockBalances[buyerId][stockSymbol] = {};
  }
  if (!stockBalances[buyerId][stockSymbol][stockType]) {
    stockBalances[buyerId][stockSymbol][stockType] = { quantity: 0, locked: 0 };
  }

  // Now it's safe to update the buyer's stock balance
  stockBalances[buyerId][stockSymbol][stockType]!.quantity += quantity;

  // Update seller's locked stock
  if (!stockBalances[sellerId]) {
    stockBalances[sellerId] = {};
  }
  if (!stockBalances[sellerId][stockSymbol]) {
    stockBalances[sellerId][stockSymbol] = {};
  }
  if (!stockBalances[sellerId][stockSymbol][stockType]) {
    stockBalances[sellerId][stockSymbol][stockType] = { quantity: 0, locked: 0 };
  }
  
  // Unlock the seller's stock after the trade
  stockBalances[sellerId][stockSymbol][stockType]!.locked -= quantity;

  // Update last traded price
  if (!lastTradedPrices[stockSymbol]) {
    lastTradedPrices[stockSymbol] = {};
  }
  lastTradedPrices[stockSymbol][stockType] = price;
}

function matchOrders(
  stockSymbol: string,
  stockType: "yes" | "no",
  isBuyOrder: boolean
) {
  const bookSide = orderBook[stockSymbol][stockType];
  const orderSide = isBuyOrder ? "buy" : "sell";
  const oppositeSide = isBuyOrder ? "sell" : "buy";

  const myOrders = bookSide[orderSide];
  const theirOrders = bookSide[oppositeSide];

  const myPrices = Object.keys(myOrders)
    .map(Number)
    .sort((a, b) => (isBuyOrder ? b - a : a - b));

  for (const myPrice of myPrices) {
    const myOrderEntries = myOrders[myPrice.toString()].orders;

    const theirPrices = Object.keys(theirOrders)
      .map(Number)
      .sort((a, b) => (isBuyOrder ? a - b : b - a));

    for (const theirPrice of theirPrices) {
      if (
        (isBuyOrder && myPrice < theirPrice) ||
        (!isBuyOrder && myPrice > theirPrice)
      ) {
        continue;
      }

      const theirOrderEntries = theirOrders[theirPrice.toString()].orders;

      while (myOrderEntries.length > 0 && theirOrderEntries.length > 0) {
        const myOrder = myOrderEntries[0];
        const theirOrder = theirOrderEntries[0];

        const tradeQuantity = Math.min(myOrder.quantity, theirOrder.quantity);
        const tradePrice = theirPrice; // Use their price for the trade

        executeTrade(
          isBuyOrder ? myOrder.userId : theirOrder.userId,
          isBuyOrder ? theirOrder.userId : myOrder.userId,
          stockSymbol,
          tradeQuantity,
          tradePrice,
          stockType
        );

        // Update quantities
        myOrder.quantity -= tradeQuantity;
        theirOrder.quantity -= tradeQuantity;
        myOrders[myPrice.toString()].total -= tradeQuantity;
        theirOrders[theirPrice.toString()].total -= tradeQuantity;

        if (myOrder.quantity === 0) {
          myOrderEntries.shift();
        }

        if (theirOrder.quantity === 0) {
          theirOrderEntries.shift();
        }
      }

      // Clean up empty price levels
      if (theirOrders[theirPrice.toString()].orders.length === 0) {
        delete theirOrders[theirPrice.toString()];
      }

      if (myOrders[myPrice.toString()].orders.length === 0) {
        delete myOrders[myPrice.toString()];
        break;
      }
    }
  }
}

export const mintTokens = (stockSymbol: string, mintEntries: MintEntry[]) => {
  const yesEntries = mintEntries.filter((entry) => entry.type === "yes");
  const noEntries = mintEntries.filter((entry) => entry.type === "no");

  const yesQuantity = yesEntries.reduce(
    (sum, entry) => sum + entry.quantity,
    0
  );
  const noQuantity = noEntries.reduce((sum, entry) => sum + entry.quantity, 0);

  if (yesQuantity !== noQuantity) {
    throw new Error("Mismatch in YES and NO quantities");
  }

  mintEntries.forEach((entry) => {
    if (!stockBalances[entry.user]) {
      stockBalances[entry.user] = {};
    }
    if (!stockBalances[entry.user][stockSymbol]) {
      stockBalances[entry.user][stockSymbol] = {
        yes: { quantity: 0, locked: 0 },
        no: { quantity: 0, locked: 0 },
      };
    }
    //@ts-ignore
    stockBalances[entry.user][stockSymbol][entry.type].quantity +=
      entry.quantity;

    const price = entry.type === "yes" ? 6 : 4; // Assuming YES is 6 and NO is 4 as per your example
    inrBalances[entry.user].locked -= entry.quantity * price * 100; // Convert to paise
  });
};

import { Market, MintEntry, OrderEntry } from "../db/types";
import { generateOrderId } from "../utils/generateOrderId";

export const buyStock = async (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;
  try{
    if (
      !userId ||
      !stockSymbol ||
      !quantity ||
      price === undefined ||
      !stockType
    )
    res.status(400).json({
      error: "Missing parameters"
    })
    if(!markets[stockSymbol]) {
      res.status(404).json({
        error: "Market not found" 
      })
    }
    const pricePaise = Math.round(price);
    const totalCost = quantity * pricePaise;

    if(!inrBalances[userId]) {
      inrBalances[userId] = {balance : 0, locked: 0};
    }
    if(inrBalances[userId].balance < totalCost) {
      res.status(400).json({
        error: "Insufficient INR balance" 
      })
    } 
    inrBalances[userId].balance -= totalCost;
    inrBalances[userId].balance += totalCost;
    
    const orderId = generateOrderId();
    const orderEntry : OrderEntry = {
      orderId,
      userId,
      quantity,
      price:pricePaise,
      orderType: "buy"
    }
   //@ts-ignore
   const bookSide = orderBook[stockSymbol][stockType];
   const priceStr = pricePaise.toString();
   if(!bookSide.buy[priceStr]) {
    bookSide.buy[priceStr] = {total : 0, orders : []};
   }
   bookSide.buy[priceStr].total += quantity;
    bookSide.buy[priceStr].orders.push(orderEntry);
  matchOrders(stockSymbol, stockType, true);

  res.status(201).json({
        messagge:"Buy order done"

  })
  }catch(error){
    res.status(404).json({
      error:"unexpected error"
    })
  }
};

export const sellStock =async (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType, stockBalances } = req.body;

  try{
    if (
      !userId ||
      !stockSymbol ||
      !quantity ||
      price === undefined ||
      !stockType
    ){
      res.status(400).json({
        error: "Missing parameters"
      });
    }
    if(!markets[stockSymbol]) {
      res.status(404).json({
        error: "Market not found"
      })
    }

    const pricePaise = Math.round(price);//ensuring price is integer paise

    if(!stockBalances[userId] ||
       !stockBalances[userId][stockSymbol] || 
       !stockBalances[userId][stockSymbol][stockType] || 
       stockBalances[userId][stockSymbol][stockType].quantity < quantity){
      res.status(400).json({
        error:"Insufficant stock balance"
      })
    }

    stockBalances[userId][stockSymbol][stockType].quantity -= quantity;
    stockBalances[userId][stockSymbol][stockType].locked += quantity;
    
    const orderId = generateOrderId();
    const orderEntry: OrderEntry = {
      orderId,
      userId,
      quantity,
      price: pricePaise,
      orderType: "sell",
    }
      //@ts-ignore
    const bookSide = orderBook[stockSymbol][stockType];
    const priceStr = pricePaise.toString();
    if(!bookSide.sell[priceStr]) {
      bookSide.sell[priceStr] = {total: 0, orders:[]}
    }
    bookSide.sell[priceStr].total += quantity;
    bookSide.sell[priceStr].orders.push(orderEntry);


    matchOrders(stockSymbol,stockType,false);
    res.status(200).json({
      message:"sell order processed"
    });

  }catch(error){
    res.status(404).json({
      error:"unexpected error occured"
    })
  }
};

export const createMarket = async (req: Request, res: Response) => {
  const {
    stockSymbol,
    title,
    description,
    startTime,
    endTime,
    initialYesTokens,
    initialNoTokens,
  } = req.body;


  try{

  if (markets[stockSymbol]) {
    res.status(400).json({ error: "Market already exists" });
 }

 const market: Market = {
   stockSymbol,
   title,
   description,
   startTime: new Date(startTime),
   endTime: new Date(endTime),
   initialYesTokens,
   initialNoTokens,
 };

 markets[stockSymbol] = market;

  // Initialize the market maker's stock balances
  if (!stockBalances[marketMakerId]) {
    stockBalances[marketMakerId] = {};
  }

  stockBalances[marketMakerId][stockSymbol] = {
    yes: {
      quantity: initialYesTokens,
      locked: 0,
    },
    no: {
      quantity: initialNoTokens,
      locked: 0,
    },
  };

  // Initialize order book for the market
  orderBook[stockSymbol] = {
    yes: {
      buy: {},
      sell: {},
    },
    no: {
      buy: {},
      sell: {},
    },
  };

  res.status(200).json({
    message:`Market ${stockSymbol} has been created`,
    data: {
      MARKET_INFO: MARKET_INFO[stockSymbol]
    }
  })

  }catch(eror) {
    res.status(404).json({
      error: "invalid error"
    })
  }
}

export const cancelOrder = async (req: Request, res: Response) => {
  const { userId, orderId, stockSymbol, stockType, price, orderSide } =  req.body;

  try{
    if (
      !userId ||
      !orderId ||
      !stockSymbol ||
      !stockType ||
      price === undefined ||
      !orderSide
    ) {
       res.status(400).json({ error: "Missing parameters" });
    }
    //@ts-ignore
    
    const bookSide = orderBook[stockSymbol][stockType][orderSide];
    const priceStr = price.toString();
    const priceLevel = bookSide[priceStr];
    
    if(!priceLevel) {
      res
      .status(404)
      .json({ error: "Order not found at this price level" });
    }


  const orderIndex = priceLevel.orders.findIndex(
    (order: OrderEntry) => order.orderId === orderId && order.userId === userId
  );

  if (orderIndex === -1) {
     res.status(404).json({ error: "Order not found" });
  }

  const order = priceLevel.orders.splice(orderIndex, 1)[0];
  priceLevel.total -= order.quantity;

  const totalAmount = order.quantity * order.price;

  if (order.orderType === "buy") {
    // Unlock INR
    inrBalances[userId].balance += totalAmount;
    inrBalances[userId].locked -= totalAmount;
  } else {
    // Unlock stocks
    //@ts-ignore

    stockBalances[userId][stockSymbol][stockType].quantity += order.quantity;
    //@ts-ignore
    stockBalances[userId][stockSymbol][stockType].locked -= order.quantity;
  }
   res.status(200).json({
    message:"Order cancelled"
  }) 

  }catch(error){
    res.status(404).json({
      error:"invalid user"
    })
  }

};

export const settleMarket = async (req: Request, res: Response) => {
  const { marketId, result } = req.body;

  try {
    // Check if the market exists
    if (!markets[marketId]) {
       res.status(404).json({ error: "Market not found" });
    }

    // Validate the result input
    if (result !== "yes" && result !== "no") {
       res.status(400).json({ error: "Invalid result" });
    }

    // Set the market result
    markets[marketId].result = result;

    // Process settlements for all users
    for (const userId in stockBalances) {
      const userStocks = stockBalances[userId][marketId];

      // Check for winning and losing stocks
      //@ts-ignore
      const winningStocks = userStocks?.[result]; // Optional chaining to avoid errors if userStocks is undefined
      const losingStocks = userStocks?.[result === "yes" ? "no" : "yes"];

      // If the user has winning stocks, calculate and distribute payouts
      if (winningStocks && winningStocks.quantity > 0) {
        const payout = winningStocks.quantity * 1000; // 1000 paise = 10 INR

        // Ensure the user has an INR balance record
        if (!inrBalances[userId]) {
          inrBalances[userId] = { balance: 0, locked: 0 };
        }

        // Update the user's balance and reset winning stocks
        inrBalances[userId].balance += payout;
        winningStocks.quantity = 0; // Reset quantity of winning stocks
      }

      // Reset losing stocks' quantities to zero
      if (losingStocks) {
        losingStocks.quantity = 0;
      }
    }

    // Remove the market after settling
    delete markets[marketId];

    // Return success response
     res.status(200).json({ message: "Market closed" });

  } catch (error) {
    // Handle unexpected errors
    console.error("Error settling market:", error); // Log the error for debugging
     res.status(500).json({ error: "Internal server error" });
  }
};

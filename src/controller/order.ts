import {
  stockBalances,
  inrBalances,
  orderBook,
  lastTradedPrices,
  marketMakerId,
  markets,
} from "../db/index";
import { Request, Response } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";

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

  inrBalances[buyerId].locked -= totalPrice;

  // Update seller's INR balance
  if (!inrBalances[sellerId]) {
    inrBalances[sellerId] = { balance: 0, locked: 0 };
  }
  inrBalances[sellerId].balance += totalPrice;

  // Update buyer's stock balance
  if (!stockBalances[buyerId]) {
    stockBalances[buyerId] = {};
  }
  if (!stockBalances[buyerId][stockSymbol]) {
    stockBalances[buyerId][stockSymbol] = {};
  }
  if (!stockBalances[buyerId][stockSymbol][stockType]) {
    stockBalances[buyerId][stockSymbol][stockType] = { quantity: 0, locked: 0 };
  }
  stockBalances[buyerId][stockSymbol][stockType].quantity += quantity;

  //@ts-ignore
  stockBalances[sellerId][stockSymbol][stockType].locked -= quantity;

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

export const buyStock = catchAsync(async (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;
  if (
    !userId ||
    !stockSymbol ||
    !quantity ||
    price === undefined ||
    !stockType
  ) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  if (!markets[stockSymbol]) {
    return res.status(404).json({ error: "Market not found" });
  }

  const pricePaise = Math.round(price);
  const totalCost = quantity * pricePaise;

  if (!inrBalances[userId]) {
    inrBalances[userId] = { balance: 0, locked: 0 };
  }

  if (inrBalances[userId].balance < totalCost) {
    return res.status(400).json({ error: "Insufficient INR balance" });
  }
  inrBalances[userId].balance -= totalCost;
  inrBalances[userId].locked += totalCost;

  const orderId = generateOrderId();
  const orderEntry: OrderEntry = {
    orderId,
    userId,
    quantity,
    price: pricePaise,
    orderType: "buy",
  };

  //@ts-ignore
  const bookSide = orderBook[stockSymbol][stockType];
  const priceStr = pricePaise.toString();
  if (!bookSide.buy[priceStr]) {
    bookSide.buy[priceStr] = { total: 0, orders: [] };
  }
  bookSide.buy[priceStr].total += quantity;
  bookSide.buy[priceStr].orders.push(orderEntry);
  matchOrders(stockSymbol, stockType, true);

  return sendResponse(res, 201, {
    message: "Buy order processed successfully",
  });
});

export const sellStock = catchAsync(async (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  // Validate input
  if (
    !userId ||
    !stockSymbol ||
    !quantity ||
    price === undefined ||
    !stockType
  ) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  if (!markets[stockSymbol]) {
    return res.status(404).json({ error: "Market not found" });
  }

  const pricePaise = Math.round(price); // Ensure price is integer paise

  // Check if user has enough stock balance
  if (
    !stockBalances[userId] ||
    !stockBalances[userId][stockSymbol] ||
    //@ts-ignore
    !stockBalances[userId][stockSymbol][stockType] ||
    //@ts-ignore
    stockBalances[userId][stockSymbol][stockType].quantity < quantity
  ) {
    return res.status(400).json({ error: "Insufficient stock balance" });
  }

  // Lock the stock quantity
  //@ts-ignore
  stockBalances[userId][stockSymbol][stockType].quantity -= quantity;
  //@ts-ignore
  stockBalances[userId][stockSymbol][stockType].locked += quantity;

  // Create the order
  const orderId = generateOrderId();
  const orderEntry: OrderEntry = {
    orderId,
    userId,
    quantity,
    price: pricePaise,
    orderType: "sell",
  };

  // Place the order into the order book
  //@ts-ignore
  const bookSide = orderBook[stockSymbol][stockType];

  const priceStr = pricePaise.toString();

  if (!bookSide.sell[priceStr]) {
    bookSide.sell[priceStr] = { total: 0, orders: [] };
  }

  bookSide.sell[priceStr].total += quantity;
  bookSide.sell[priceStr].orders.push(orderEntry);

  // Try to match with existing buy orders
  matchOrders(stockSymbol, stockType, false);

  return sendResponse(res, 200, {
    message: "Sell order processed successfully",
  });
});

export const createMarket = catchAsync(async (req: Request, res: Response) => {
  const {
    stockSymbol,
    title,
    description,
    startTime,
    endTime,
    initialYesTokens,
    initialNoTokens,
  } = req.body;

  if (markets[stockSymbol]) {
    return res.status(400).json({ error: "Market already exists" });
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

  return sendResponse(res, 200, {
    message: `Market ${stockSymbol} has been created`,
    data: {
      marketInfo: MARKET_INFO[stockSymbol],
    },
  });
});

export const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const { userId, orderId, stockSymbol, stockType, price, orderSide } =
    req.body;

  if (
    !userId ||
    !orderId ||
    !stockSymbol ||
    !stockType ||
    price === undefined ||
    !orderSide
  ) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  //@ts-ignore
  const bookSide = orderBook[stockSymbol][stockType][orderSide];
  const priceStr = price.toString();
  const priceLevel = bookSide[priceStr];

  if (!priceLevel) {
    return res
      .status(404)
      .json({ error: "Order not found at this price level" });
  }

  const orderIndex = priceLevel.orders.findIndex(
    (order: OrderEntry) => order.orderId === orderId && order.userId === userId
  );

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = priceLevel.orders.splice(orderIndex, 1)[0];
  priceLevel.total -= order.quantity;

  // Unlock balances
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
  return sendResponse(res, 200, { message: "Order cancelled" });
});

export const settleMarket = catchAsync(async (req: Request, res: Response) => {
  const { marketId, result } = req.body;

  if (!markets[marketId]) {
    return res.status(404).json({ error: "Market not found" });
  }

  if (result !== "yes" && result !== "no") {
    return res.status(400).json({ error: "Invalid result" });
  }

  markets[marketId].result = result;

  // Process settlement
  for (const userId in stockBalances) {
    const userStocks = stockBalances[userId][marketId];
    if (userStocks) {
      //@ts-ignore
      const winningStocks = userStocks[result];
      const losingStocks = userStocks[result === "yes" ? "no" : "yes"];

      if (winningStocks && winningStocks.quantity > 0) {
        // Each winning stock is valued at face value (e.g., 1000 paise = 10 INR)
        const payout = winningStocks.quantity * 1000; // 1000 paise = 10 INR
        if (!inrBalances[userId]) {
          inrBalances[userId] = { balance: 0, locked: 0 };
        }
        inrBalances[userId].balance += payout;
        winningStocks.quantity = 0;
      }

      if (losingStocks) {
        losingStocks.quantity = 0;
      }
    }
  }

  delete markets[marketId];
  return sendResponse(res, 200, { data: "market closed" });
});

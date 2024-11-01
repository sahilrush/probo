import { v4 as uuidv4 } from 'uuid';
import { inrBalances, MarketPrice, orderBooks, stockBalances, stockSymbols } from '../db';
import { OrderBook, StockSymbol } from '../db/types';
import { message, publishMessage } from '../utils/publisResponse';

// Initialize a new market
export const createMarket = async (data: StockSymbol, eventId: string): Promise<any> => {
  const { stockSymbol, title, description } = data;

  try {
    if (stockSymbols[stockSymbol]) {
      return publishMessage(message(400, `Market with symbol ${stockSymbol} already exists`, null), eventId);
    }

    const initialOrderBook: OrderBook = { yes: {}, no: {} };

  orderBooks[stockSymbol] = initialOrderBook;
    stockSymbols[stockSymbol] = { stockSymbol, title, description };

    return publishMessage(message(200, "Successfully created market", `${stockSymbol}`), eventId);
  } catch (error: any) {
    console.error("Error in createMarket:", error.message);
    return publishMessage(message(500, "An error occurred", { error: error.message }), eventId);
  }
}
// };

// export const initializeUserBalance = (userId: string, initialBalance: number = 0) => {
//   if (!inrBalances[userId]) {
//     inrBalances[userId] = { balance: initialBalance, locked: 0 };
//   }
//   if (!stockBalances[userId]) {
//     stockBalances[userId] = {};
//   }
// };

// export const initializeUserStockHolding = (userId: string, stockSymbol: string) => {
//   if (!stockBalances[userId][stockSymbol]) {
//     stockBalances[userId][stockSymbol] = {
//       yes: { quantity: 0, locked: 0 },
//       no: { quantity: 0, locked: 0 }
//     };
//   }
// };

// export const placeOrder = (
//   userId: string,
//   stockSymbol: string,
//   orderType: "sell" | "reversed",
//   optionType: "yes" | "no",
//   price: number,
//   quantity: number
// ): boolean => {
//   try {
//     initializeUserBalance(userId);
//     initializeUserStockHolding(userId, stockSymbol);

//     const orderBook = orderBooks[stockSymbol];
//     if (!orderBook) return false;

//     if (!validateOrder(userId, stockSymbol, orderType, optionType, price, quantity)) {
//       console.log("Order validation failed for user:", userId);
//       return false;
//     }

//     if (!orderBook[optionType][price]) {
//       orderBook[optionType][price] = { total: 0, orders: {} };
//     }

//     const orderId = uuidv4();
//     const priceLevel = orderBook[optionType][price];

//     priceLevel.orders[orderId] = { type: orderType, quantity };
//     priceLevel.total += quantity;

//     if (orderType === "sell") {
//       stockBalances[userId][stockSymbol][optionType].locked += quantity;
//     } else {
//       inrBalances[userId].locked += quantity * price;
//     }

//     return true;
//   } catch (error) {
//     console.error("Error placing order:", error);
//     return false;
//   }
// };

// const validateOrder = (
//   userId: string,
//   stockSymbol: string,
//   orderType: "sell" | "reversed",
//   optionType: "yes" | "no",
//   price: number,
//   quantity: number
// ): boolean => {
//   if (orderType === "sell") {
//     const availableQuantity =
//       stockBalances[userId][stockSymbol][optionType].quantity -
//       stockBalances[userId][stockSymbol][optionType].locked;
//     return availableQuantity >= quantity;
//   } else {
//     const requiredBalance = price * quantity;
//     const availableBalance = inrBalances[userId].balance - inrBalances[userId].locked;
//     return availableBalance >= requiredBalance;
//   }
// };

// // Get order book for a market
// export const getaOrderBook = (stockSymbol: string, optionType: "yes" | "no") => {
//   const book = orderBooks[stockSymbol]?.[optionType] ?? {};
//   return Object.entries(book)
//     .map(([price, level]) => ({ price: Number(price), quantity: level.total }))
//     .sort((a, b) => b.price - a.price);
// };

// // Get user's position in a market
// export const getUserPosition = (userId: string, stockSymbol: string) => {
//   initializeUserBalance(userId);
//   initializeUserStockHolding(userId, stockSymbol);

//   return { inr: inrBalances[userId], stock: stockBalances[userId][stockSymbol] };
// };

// // Cancel an order
// export const cancelOrder = (
//   userId: string,
//   stockSymbol: string,
//   optionType: "yes" | "no",
//   price: number,
//   orderId: string
// ): boolean => {
//   try {
//     const orderBook = orderBooks[stockSymbol];
//     if (!orderBook?.[optionType]?.[price]?.orders[orderId]) {
//       return false;
//     }

//     const order = orderBook[optionType][price].orders[orderId];
//     const priceLevel = orderBook[optionType][price];

//     if (order.type === "sell") {
//       stockBalances[userId][stockSymbol][optionType].locked -= order.quantity;
//     } else {
//       inrBalances[userId].locked -= order.quantity * price;
//     }

//     priceLevel.total -= order.quantity;
//     delete priceLevel.orders[orderId];

//     if (priceLevel.total === 0) {
//       delete orderBook[optionType][price];
//     }

//     return true;
//   } catch (error) {
//     console.error("Error canceling order:", error);
//     return false;
//   }
// };

import e, { Response, Request } from "express";
import crypto from "crypto"
import { inrBalances, orderBooks, stockBalances, stockSymbols } from "../db";
import { message, publishMessage } from "../utils/publisResponse";


interface PlaceOrderRequest {
  userId: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  stockType: "yes" | "no";
}
interface OrderListItem {
  id: string;
  stockSymbol: string;
  stockType: "yes" | "no";
  createdAt: string;
  userId: string;
  quantity: number;
  price: number;
  orderType: "buy" | "sell";
  totalPrice: number;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Comprehensive order validation
const validateOrder = (
  userId: string, 
  stockSymbol: string,
  quantity: number, 
  price: number
): ValidationResult => {
  if (!orderBooks[stockSymbol]) {
    return { isValid: false, error: `Stock symbol '${stockSymbol}' not found in order books` };
  }
  


  if (quantity <= 0 || price <= 0) {
    return { isValid: false, error: "Quantity and price must be greater than 0" };
  }
  

  if (!inrBalances[userId]) {
    return { isValid: false, error: "User not found" };
  }

  const totalCost = quantity * price * 100;
  if (inrBalances[userId].balance < totalCost) {
    return { isValid: false, error: "Insufficient balance" };
  }

  return { isValid: true };
};

const processOrders = (
  stockSymbol: string,
  orderType: "yes" | "no",
  price: number,
  quantity: number,
  tradePrice: number
): number => {
  let remainingQty = quantity;
  const orders = orderBooks[stockSymbol][orderType][price].orders;
 
  for (const sellerId in orders) {
    if (remainingQty <= 0) break;

    const available = orders[sellerId].quantity;
    const toTake = Math.min(available, remainingQty);

    orders[sellerId].quantity -= toTake;
    orderBooks[stockSymbol][orderType][price].total -= toTake;
    remainingQty -= toTake;

    if (orders[sellerId].type === "sell") {
      if (stockBalances[sellerId]?.[stockSymbol]?.[orderType]) {
        stockBalances[sellerId][stockSymbol][orderType].locked -= toTake;
        inrBalances[sellerId].balance += toTake * tradePrice * 100;
      }
    } else {
      const reverseType = orderType === "yes" ? "no" : "yes";
      if (stockBalances[sellerId]?.[stockSymbol]?.[reverseType]) {
        stockBalances[sellerId][stockSymbol][reverseType].quantity += toTake;
        inrBalances[sellerId].locked -= toTake * tradePrice * 100;
      }
    }

    if (orders[sellerId].quantity === 0) {
      delete orders[sellerId];
    }
  }

  if (orderBooks[stockSymbol][orderType][price].total === 0) {
    delete orderBooks[stockSymbol][orderType][price];
  }
 
  return remainingQty;
};

// Create mint order
const mintOrder = (
  stockSymbol: string,
  price: number,
  quantity: number,
  userId: string,
  orderType: "yes" | "no"
) => {
  const oppositePrice = 10 - price;
  if (!orderBooks[stockSymbol][orderType][oppositePrice]) {
    orderBooks[stockSymbol][orderType][oppositePrice] = {
      total: 0,
      orders: {},
    };
  }
  orderBooks[stockSymbol][orderType][oppositePrice].total += quantity;
  orderBooks[stockSymbol][orderType][oppositePrice].orders[userId] = {
    type: "reversed",
    quantity:
      (orderBooks[stockSymbol][orderType][oppositePrice].orders[userId]?.quantity || 0) + quantity,
  };
};

// Initialize user stock balances
const initializeStockBalances = (userId: string, stockSymbol: string) => {
  if (!stockBalances[userId]) {
    stockBalances[userId] = {};
  }
  if (!stockBalances[userId][stockSymbol]) {
    stockBalances[userId][stockSymbol] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 },
    };
  }
};

export const createBuyOrder = async ( data:OrderListItem, eventId:string): Promise<any> => {
  const { userId, stockSymbol, quantity, price, stockType } = data;
  try {
    // Validate order
    const validation = validateOrder(userId, stockSymbol, quantity, price);
    if (!validation.isValid) {
      return publishMessage(message(400, "Invalid params", null),eventId);
    }

    const orderId = crypto.randomUUID();
    const reverseStockType = stockType === "no" ? "yes" : "no";

    // Lock funds for the order
    inrBalances[userId].balance -= quantity * price * 100;
    inrBalances[userId].locked += quantity * price * 100;

    // Initialize stock balances
    initializeStockBalances(userId, stockSymbol);

    // Check available quantities
    let availableQuantity = orderBooks[stockSymbol][stockType][price]?.total || 0;
    let availableReverseQuantity = orderBooks[stockSymbol][reverseStockType][10 - price]?.total || 0;

    let remainingQty = quantity;
    let filledQty = 0;

    // Process matching orders
    if (availableQuantity > 0) {
      const processedQty = quantity - processOrders(
        stockSymbol,
        stockType,
        price,
        remainingQty,
        price
      );
      remainingQty -= processedQty;
      filledQty += processedQty;
    }

    // Process reverse orders
    if (availableReverseQuantity > 0 && remainingQty > 0) {
      const processedQty = remainingQty - processOrders(
        stockSymbol,
        reverseStockType,
        10 - price,
        remainingQty,
        10 - price
      );
      remainingQty -= processedQty;
      filledQty += processedQty;
    }

    // Create mint order for remaining quantity
    if (remainingQty > 0) {
      mintOrder(stockSymbol, price, remainingQty, userId, reverseStockType);
    }

    // Update user's stock balance
    if (stockBalances[userId][stockSymbol]?.[stockType]) {
      stockBalances[userId][stockSymbol][stockType].quantity += quantity - remainingQty;
    }

    // Update locked balance
    inrBalances[userId].locked -= (quantity - remainingQty) * price * 100;

    // Create order record
    const orderDetails: OrderListItem = {
      id: orderId,
      stockSymbol,
      stockType,
      createdAt: new Date().toISOString(),
      userId,
      quantity,
      price: price * 100,
      orderType: "buy",
      totalPrice: quantity * price * 100
    };


publishMessage(message(201, `Buy order for ${stockType} added for ${stockSymbols}`, {
  orderId,
  filledQuantity: filledQty,  
  remainingQuantity: remainingQty,  
  orderDetails  
}), eventId)


  } catch (error) {
    console.error("Error creating buy order:", error);
    publishMessage(message(500,"Invalid error occured",{error:message} ),eventId)
  }
};

export const createSellOrder = async (data:OrderListItem, eventId:string): Promise<any> => {
  const { userId, stockSymbol, quantity, price, stockType } = data;

  try {
    // First validate if stock exists in orderBooks
    if (!orderBooks[stockSymbol]) {
        publishMessage(message(400, `Stock symbol ${stockSymbol} not found in order books`,null),eventId)
    }

    // Check if user has sufficient stocks
    if (
      !stockBalances[userId]?.[stockSymbol] ||
      !stockBalances[userId]?.[stockSymbol][stockType] ||
      stockBalances[userId][stockSymbol][stockType].quantity < quantity
    ) {

      publishMessage(message(400,"insufficant stocks to sell",null),eventId)  
    }

    // Additional validation for quantity and price
    if (quantity <= 0 || price <= 0) {
      publishMessage(message(400,"Quantity and price must be greater than 0",null),eventId) 
      
    }

    const orderId = crypto.randomUUID();
    const reverseStockType = stockType === "no" ? "yes" : "no";
    let remainingQuantity = quantity;
    let filledQuantity = 0;

    // Lock stocks for selling
    stockBalances[userId][stockSymbol][stockType].quantity -= quantity;
    stockBalances[userId][stockSymbol][stockType].locked += quantity;

    // Process matching buy orders
    for (let p in orderBooks[stockSymbol][reverseStockType]) {
      if (remainingQuantity <= 0) break;
      if (parseFloat(p) > 10 - price) continue;

      for (let buyerId in orderBooks[stockSymbol][reverseStockType][p].orders) {
        if (remainingQuantity <= 0) break;

        const availableQuantity = orderBooks[stockSymbol][reverseStockType][p].orders[buyerId].quantity;
        const matchedQuantity = Math.min(availableQuantity, remainingQuantity);

        // Update order book
        orderBooks[stockSymbol][reverseStockType][p].orders[buyerId].quantity -= matchedQuantity;
        orderBooks[stockSymbol][reverseStockType][p].total -= matchedQuantity;
        remainingQuantity -= matchedQuantity;
        filledQuantity += matchedQuantity;

        // Update buyer's stock balance
        if (stockBalances[buyerId][stockSymbol][reverseStockType]) {
          stockBalances[buyerId][stockSymbol][reverseStockType].locked -= matchedQuantity;
        }

        // Transfer funds
        inrBalances[buyerId].balance += matchedQuantity * parseFloat(p) * 100;
      }

      // Clean up empty price levels
      if (orderBooks[stockSymbol][reverseStockType][p].total === 0) {
        delete orderBooks[stockSymbol][reverseStockType][p];
      }
    }

    // Update seller's balance
    inrBalances[userId].balance += (quantity - remainingQuantity) * price * 100;
    stockBalances[userId][stockSymbol][stockType].locked -= quantity - remainingQuantity;

    // Create new sell order for remaining quantity
    if (remainingQuantity > 0) {
      if (!orderBooks[stockSymbol][stockType][price]) {
        orderBooks[stockSymbol][stockType][price] = { total: 0, orders: {} };
      }

      orderBooks[stockSymbol][stockType][price].total += remainingQuantity;
      orderBooks[stockSymbol][stockType][price].orders[userId] = {
        quantity: remainingQuantity,
        type: "sell"
      };
    }

    // Create order record
    const orderDetails: OrderListItem = {
      id: orderId,
      stockSymbol,
      stockType,
      createdAt: new Date().toISOString(),
      userId,
      quantity,
      price: price * 100,
      orderType: "sell",
      totalPrice: quantity * price * 100
    };

      publishMessage(message(201, `Sell order for ${stockType} stock placed for ${stockSymbol}`, {
        orderId,
        filledQuantity,
        remainingQuantity,
        orderDetails
      }), eventId)

  } catch (error) {
    console.error("Error creating sell order:", error);
    // Rollback changes if error occurs
    if (stockBalances[userId]?.[stockSymbol]?.[stockType]) {
      stockBalances[userId][stockSymbol][stockType].quantity += quantity;
      stockBalances[userId][stockSymbol][stockType].locked -= quantity;
    }
    publishMessage(message(500, "An error occurred", { error: message }), eventId); 
  }
};


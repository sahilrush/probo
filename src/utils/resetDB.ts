import { ORDERBOOK, INR_BALANCES, STOCK_BALANCES, STOCK_SYMBOLS } from "../db/index";

export const resetDB = () => {

  for (const key in ORDERBOOK) {
    delete ORDERBOOK[key];
  }

  for (const key in INR_BALANCES) {
    delete INR_BALANCES[key];
  }

  for (const key in STOCK_BALANCES) {
    delete STOCK_BALANCES[key];
  }

  for (const key in STOCK_SYMBOLS) {
    delete STOCK_SYMBOLS[key];
  }

  console.log("All data has been reset to empty objects.");
};

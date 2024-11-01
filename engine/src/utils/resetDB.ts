import {  inrBalances, stockBalances, orderBooks } from "../db/index";

export const resetDB = () => {

  for (const key in orderBooks) {
    delete orderBooks[key];
  }

  for (const key in inrBalances) {
    delete inrBalances[key];
  }

  for (const key in stockBalances) {
    delete stockBalances[key];
  }

  // for (const key in STOCK_SYMBOLS) {s
  //   delete STOCK_SYMBOLS[key];
  // }

  console.log("All data has been reset to empty objects.");
};

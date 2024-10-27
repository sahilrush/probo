export interface UserBalance {
  balance: number;  // Available balance
  locked: number;   // Amount locked in orders
}

export interface InrBalances {
  [userId: string]: UserBalance;
}




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

export interface StockBalances {
  [userId: string]: {
    [stockSymbol: string]: StockBalance;
  };
}


export interface OrderEntry {
  total: number; // Total quantity for this price level
  orders: {
    [userId: string]: number; // UserId and quantity ordered
  };
}


export interface OrderBook {
  [symbol: string]: {
    reverse: {
      yes: {
        [price: number]: {
          mint: {
            participants: {
              price: number;
              userId: string;
              quantity: number;
              type: "buy" | "sell";
            }[];
            remainingQty: number;
          };
          total: number;
        };
      };
      no: {
        [price: number]: {
          mint: {
            participants: {
              price: number;
              userId: string;
              quantity: number;
              type: "buy" | "sell";
            }[];
            remainingQty: number;
          };
          total: number;
        };
      };
    };
    direct: {
      yes: {
        [price: number]: OrderEntry; // Direct buy orders
      };
      no: {
        [price: number]: OrderEntry; // Direct sell orders
      };
    };
  };
}


export interface StockSymbol {
  stockSymbol: string; // The symbol of the stock/option
  title: string;       // A title for the stock
  description: string; // Description of the stock/option
}

export interface StockSymbols {
  [stockSymbol: string]: StockSymbol;
}


















// export interface UserBalance {
//   balance: number;
//   locked: number;
// }

// export interface InrBalances {
//   [userId: string]: UserBalance;
// }

// export interface OrderEntry {
//   total: number;
//   orders: {
//     [userId: string]: number;
//   };
// }

// export interface StockSymbol {
//   stockSymbol: string;
// }

// export interface StockSymbols {
//   [stockSymbol: string]: StockSymbol;
// }

// export interface StockBalance {
//   yes: {
//     quantity: number;
//     locked: number;
//   };
//   no: {
//     quantity: number;
//     locked: number;
//   };
// }

// export interface StockBalances {
//   [userId: string]: {
//     [stockSymbol: string]: StockBalance;
//   };
// }

// export interface OrderListItem {
//   stockSymbol: string;
//   stockType: string;
//   createdAt: Date;
//   userId: string;
//   quantity: number;
//   price: number;
//   id: string;
//   orderType: string;
//   totalPrice: number;
//   status: "executed" | "pending";
// }

// export interface Market {
//   stockSymbol: string;
//   title: string;
//   description: string;
//   startTime: Date;
//   endTime: Date;
//   yes: number;
//   no: number;
//   result: StockType | null;
// }
// export interface Markets {
//   [stockSymbol: string]: Market;
// }
// export type StockType = "yes" | "no";






// export interface OrderBook {
//   [symbol: string]: {
//     yes: {
//       [price: number]: OrderEntry;
//     };
//     no: {
//       [price: number]: OrderEntry;
//     };
//   };
// }







// // export interface OrderBook {
// //   [symbol: string]: {
// //     reverse: {
// //       yes: {
// //         [price: number]: {
// //           mint: {
// //             participants: {
// //               price:number;
// //               userId: string;
// //               quantity: number;
// //               type: "buy" | "sell";
// //             }[];
// //             remainingQty: number;
// //           };
// //           total: number;
// //         };
// //       };
// //       no: {
// //         [price: number]: {
// //           mint: {
// //             participants: {
// //               price:number;
// //               userId: string;
// //               quantity: number;

// //               type: "buy" | "sell";
// //             }[];
// //             remainingQty: number;
// //           };
// //           total: number;
// //         };
// //       };
// //     };
// //     direct: {
// //       yes: {
// //         [price: number]: OrderEntry;
// //       };
// //       no: {
// //         [price: number]: OrderEntry;
// //       };
// //     };
// //   };
// // }
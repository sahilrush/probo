
import { InrBalances, StockBalances, OrderBook,  Market } from "./types";


export const markets: { [marketId: string]: Market } = {};
export const inrBalances: InrBalances = {};
export const stockBalances: StockBalances = {};
export const orderBook: OrderBook = {};
export const lastTradedPrices: { [stockSymbol: string]: { yes?: number; no?: number } } = {};
export const marketMakerId = 'probo';

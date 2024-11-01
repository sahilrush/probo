"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = exports.redis = void 0;
const express_1 = __importDefault(require("express"));
const ioredis_1 = __importDefault(require("ioredis"));
const balance_1 = require("./routes/balance");
const user_1 = require("./routes/user");
const onramp_1 = require("./routes/onramp");
const orderBook_1 = require("./routes/orderBook");
const createSymbol_1 = require("./routes/createSymbol");
const order_1 = require("./routes/order");
// import { resetDB } from "./utils/resetDB";
// import { orderRoute } from "./routes/order";
exports.redis = new ioredis_1.default({
    port: 6379,
    host: "localhost"
});
exports.subscriber = new ioredis_1.default({ port: 6379, host: "localhost" });
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send("Options Trading App");
});
app.use(express_1.default.json());
app.post("/reset", (req, res) => {
    // resetDB()
    res.status(200);
});
app.get('/', (req, res) => {
    res.send("Options Trading App");
});
app.use('/user', user_1.userRouter);
app.use('/balance', balance_1.balanceRouter);
app.use('/onramp', onramp_1.onrampRouter);
app.use('/orderbook', orderBook_1.orderBookRouter);
app.use('/symbol', createSymbol_1.createSymbolRouter);
app.use('/trade', order_1.orderRouter);

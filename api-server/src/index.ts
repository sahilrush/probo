import express from "express";
import Redis from "ioredis";
import { balanceRouter } from "./routes/balance";
import { userRouter } from "./routes/user";
import { onrampRouter } from "./routes/onramp";
import { orderBookRouter } from "./routes/orderBook";
import { createSymbolRouter } from "./routes/createSymbol";
import { orderRouter } from "./routes/order";
// import { resetDB } from "./utils/resetDB";

export const redis = new Redis({
    port: 6379,
    host: "localhost"
});
export const subscriber = new Redis({ port: 6379, host: "localhost" });

redis.on("error", (error) => {
    console.error("Redis connection error:", error);
});
subscriber.on("error", (error) => {
    console.error("Redis subscriber error:", error);
});

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Options Trading App");
});

app.post("/reset", (req, res) => {
    // resetDB();
    res.status(200).send("Database reset");
});

app.use('/user', userRouter);
app.use('/balance', balanceRouter);
app.use('/onramp', onrampRouter);
app.use('/orderbook', orderBookRouter);
app.use('/symbol', createSymbolRouter);
app.use('/trade', orderRouter);

const PORT = 8087;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

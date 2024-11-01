
import express from "express"
import Redis from "ioredis"
import { balanceRouter } from "./routes/balance";
import { userRouter } from "./routes/user";
import { onrampRouter } from "./routes/onramp";
import { orderBookRouter } from "./routes/orderBook";
import { createSymbolRouter } from "./routes/createSymbol";
import { orderRouter } from "./routes/order";
// import { resetDB } from "./utils/resetDB";
// import { orderRoute } from "./routes/order";



export const redis = new Redis({
    port:6379,
    host:"localhost"
})
export const subscriber =  new Redis({ port: 6379, host: "localhost" });


const app = express();
app.use(express.json());
app.get('/', (req, res) => {
    res.send("Options Trading App");
});

app.use(express.json());
app.post("/reset",(req,res)=>{
    // resetDB()
    res.status(200)
});
app.get('/', (req, res) => {
    res.send("Options Trading App");
});
app.use('/user', userRouter);
app.use('/balance', balanceRouter);
app.use('/onramp', onrampRouter);
app.use('/orderbook', orderBookRouter);
app.use('/symbol', createSymbolRouter)
app.use('/trade',orderRouter)



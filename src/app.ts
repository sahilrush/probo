
import express from "express";
import { balanceRouter } from "./routes/balance";
import { userRouter } from "./routes/user";
import { onrampRouter } from "./routes/onramp";
import { orderBookRouter } from "./routes/orderBook";
import { resetDB } from "./utils/resetDB";
import { createSymbolRouter } from "./routes/createSymbol";
import { buyOrderRouter } from "./routes/buyOrder";
import { sellOrderRouter } from "./routes/sellOrder";
// import { marketRouter } from "./routes/market";

const app = express();
app.use(express.json());  

app.use(express.json());
app.post("/reset",(req,res)=>{
    resetDB()
    res.status(200)
})
app.get('/', (req, res) => {
    res.send("Options Trading App ....");
});
app.use('/user', userRouter);
app.use('/balance', balanceRouter);
app.use('/onramp', onrampRouter);
app.use('/orderbook', orderBookRouter);
app.use('/symbol', createSymbolRouter)
app.use('/order',buyOrderRouter)
app.use('/order',sellOrderRouter)

export default app;
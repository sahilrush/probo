
// import express from "express";
// import { balanceRouter } from "./routes/balance";
// import { userRouter } from "./routes/user";
// import { onrampRouter } from "./routes/onramp";
// import { orderBookRouter } from "./routes/orderBook";
// import { resetDB } from "./utils/resetDB";
// import { createSymbolRouter } from "./routes/createSymbol";

// import { orderRoute } from "./routes/order";
// // import { marketRouter } from "./routes/market";


// app.use(express.json());
// app.post("/reset",(req,res)=>{
//     resetDB()
//     res.status(200)
// });
// app.get('/', (req, res) => {
//     res.send("Options Trading App");
// });
// app.use('/user', userRouter);
// app.use('/balance', balanceRouter);
// app.use('/onramp', onrampRouter);
// app.use('/orderbook', orderBookRouter);
// app.use('/symbol', createSymbolRouter)
// app.use('/trade',orderRoute)


// export default app;


import { createBuyOrder, createSellOrder } from './actions/order';
import {redis} from './index'
export const processMessages = async ()=>{
    try {
        const message = await redis.rpop("messageQueue");
        if(message){
            const parsedData = JSON.parse(message);
            const { data, endPoint, eventId } = parsedData;
            console.log(parsedData)
            switch (endPoint) {
              case "BUY_STOCK":
                await createBuyOrder(data,eventId);
                break;
              case "SELL_STOCK":
                await createSellOrder(data,eventId);
                break;
            }
        }
    } catch (error) {
        console.log(error)
    }
}   
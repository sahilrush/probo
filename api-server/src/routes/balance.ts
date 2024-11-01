import express, { Request } from "express";
import { pushToQueue } from "../helper/redis";

export const balanceRouter = express.Router();

balanceRouter.get("/inr/:userId", async (req: Request, res) => {
  try {
    await pushToQueue("INR_balance", req.params.userId , res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});

balanceRouter.get("/inr/", async(req: Request, res) => {
  try {
   await  pushToQueue("All_INR_balance", {}, res);
   

  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});

balanceRouter.get("/stock/:userId", async(req: Request, res) => {
  try {
   await pushToQueue("GET_STOCK_BY",  req.params.userId , res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});

balanceRouter.get("/stock/",async (req: Request, res) => {
  try {
   await pushToQueue("All_stock_balance", {}, res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});

import express from "express"

import { createUser } from "../actions/user";
export const userRouter = express.Router();
userRouter.post("/create/:userId",createUser);
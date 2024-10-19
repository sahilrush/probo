import express from "express"
import { onrampInr } from "../actions/onramp";

export const onrampRouter = express.Router();

onrampRouter.post("/inr/",onrampInr);
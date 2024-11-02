"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const express_1 = __importDefault(require("express"));
const redis_1 = require("../helper/redis");
exports.orderRouter = express_1.default.Router();
exports.orderRouter.post("/buy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("first");
        yield (0, redis_1.pushToQueue)("BUY_ORDER", req.body, res);
    }
    catch (err) {
        res.status(500).send(err);
    }
}));
exports.orderRouter.post("/sell", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, redis_1.pushToQueue)("SELL_ORDER", req.body, res);
    }
    catch (err) {
        res.status(500).send(err);
    }
}));

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
exports.balanceRouter = void 0;
const express_1 = __importDefault(require("express"));
const redis_1 = require("../helper/redis");
exports.balanceRouter = express_1.default.Router();
exports.balanceRouter.get("/inr/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, redis_1.pushToQueue)("INR_balance", { user: req.params.userId }, res);
    }
    catch (error) {
        res.status(500).send(error === null || error === void 0 ? void 0 : error.message);
    }
}));
exports.balanceRouter.get("/inr/", (req, res) => {
    try {
        (0, redis_1.pushToQueue)("All_INR_balance", {}, res);
    }
    catch (error) {
        res.status(500).send(error === null || error === void 0 ? void 0 : error.message);
    }
});
exports.balanceRouter.get("/stock/:userId", (req, res) => {
    try {
        (0, redis_1.pushToQueue)("getStockByUserId", { user: req.params.userId }, res);
    }
    catch (error) {
        res.status(500).send(error === null || error === void 0 ? void 0 : error.message);
    }
});
exports.balanceRouter.get("/stock/", (req, res) => {
    try {
        (0, redis_1.pushToQueue)("All_stock_balance", {}, res);
    }
    catch (error) {
        res.status(500).send(error === null || error === void 0 ? void 0 : error.message);
    }
});

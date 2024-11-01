"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderBookRouter = void 0;
const express_1 = __importDefault(require("express"));
const redis_1 = require("../helper/redis");
exports.orderBookRouter = express_1.default.Router();
exports.orderBookRouter.get("/", (req, res) => {
    try {
        (0, redis_1.pushToQueue)("ORDER_BOOK", req.body, res);
    }
    catch (err) {
        res.status(500).send(err);
    }
});

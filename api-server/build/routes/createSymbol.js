"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSymbolRouter = void 0;
const express_1 = __importDefault(require("express"));
const redis_1 = require("../helper/redis");
exports.createSymbolRouter = express_1.default.Router();
exports.createSymbolRouter.post("/create", (req, res) => {
    try {
        (0, redis_1.pushToQueue)("CREATE_STOCK", req.body, res);
    }
    catch (error) {
        res.status(500).send(error);
    }
});

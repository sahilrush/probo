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
exports.pushToQueue = void 0;
const __1 = require("..");
const crypto_1 = __importDefault(require("crypto"));
function pushToQueue(endPoint, data, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventId = generateId();
            const message = { endPoint, data, eventId };
            // Ensure data can be stringified
            const messageString = JSON.stringify(message);
            yield __1.redis.lpush("messageQueue", messageString);
            console.log(`Waiting for response for event: ${eventId}`);
            const messageHandler = (channel, messageFromPublisher) => __awaiter(this, void 0, void 0, function* () {
                if (channel === eventId) {
                    __1.subscriber.unsubscribe(eventId);
                    const { statusCode, message, data } = JSON.parse(messageFromPublisher);
                    res.status(statusCode).send({ message, data });
                }
            });
            yield __1.subscriber.subscribe(eventId);
            __1.subscriber.on("message", messageHandler);
        }
        catch (error) {
            const err = error;
            console.error("Error queuing message:", err.message); // Log the error message
            res.status(500).send({ status: "Error queuing message", error: err.message });
        }
    });
}
exports.pushToQueue = pushToQueue;
function generateId() {
    return crypto_1.default.randomUUID();
}

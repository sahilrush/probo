import { redis } from "..";

interface MessageType {
    statusCode: number;
    message: string;
    data: null | Object;
}

export const publishMessage = async (message: MessageType, eventId: string) => {
    try {
        const parsedMessage = JSON.stringify(message);
        await redis.publish(eventId, parsedMessage);
        console.log(`Published message to channel ${eventId}: ${parsedMessage}`);
    } catch (error) {
        console.error("Error publishing message:", error);
    }
};

export const message = (statusCode: number, message: string, data: null | Object) => {
    return {
        statusCode,
        message,
        data,
    };
};

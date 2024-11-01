import { redis, subscriber } from "..";
import crypto from 'crypto';

export async function pushToQueue(endPoint: string, data: any, res: any) {
  try {
    const eventId = generateId(); 
    const message = { endPoint, data, eventId };
    
    // Ensure data can be stringified
    const messageString = JSON.stringify(message);
    await redis.lpush("messageQueue", messageString);

    console.log(`Waiting for response for event: ${eventId}`);
    

    const messageHandler = async (channel: string, messageFromPublisher: string) => {
      if (channel === eventId) {
        subscriber.unsubscribe(eventId); 
        const { statusCode, message, data } = JSON.parse(messageFromPublisher);
        res.status(statusCode).send({ message, data });
      }
    };

    await subscriber.subscribe(eventId); 
    subscriber.on("message", messageHandler);

  } catch (error) {
    const err = error as any;
    console.error("Error queuing message:", err.message); // Log the error message
    res.status(500).send({ status: "Error queuing message", error: err.message });
  }
}

function generateId() {
    return crypto.randomUUID();
}

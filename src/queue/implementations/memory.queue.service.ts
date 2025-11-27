import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  PublishResponse,
  QueueClient,
  SubscribeResponse,
} from '../queue.interface';

@Injectable()
export class MemoryQueueService implements QueueClient {
  private readonly logger = new Logger(MemoryQueueService.name);
  private subscribers = new Map<string, ((msg: any) => Promise<void>)[]>();

  async publish<T>(queueName: string, message: T): Promise<PublishResponse> {
    await Promise.resolve();
    this.logger.log(
      `Publish to [${queueName}] (memory): ${JSON.stringify(message)}`,
    );
    const handlers = this.subscribers.get(queueName) || [];
    if (handlers.length === 0) throw new NotFoundException('Queue not found');
    for (const handler of handlers) {
      handler(message).catch((err) =>
        this.logger.error(`Handler error for queue ${queueName}`, err),
      );
    }
    return { message: 'Message published in queue' };
  }

  async subscribe(
    queueName: string,
    handler: (message: any) => Promise<void>,
  ): Promise<SubscribeResponse> {
    await Promise.resolve();
    const handlers = this.subscribers.get(queueName) || [];
    handlers.push(handler);
    this.subscribers.set(queueName, handlers);
    const feedback = `Subscribed handler to memory queue [${queueName}]`;
    this.logger.log(feedback);
    return { message: feedback };
  }
}

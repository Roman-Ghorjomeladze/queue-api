import { Injectable, Logger } from '@nestjs/common';

import {
  PublishResponse,
  QueueClient,
  SubscribeResponse,
} from '../queue.interface';

/**
 * In-memory queue implementation for development and testing.
 * Messages are stored in memory and handlers are called synchronously.
 *
 * @remarks
 * This implementation does not persist messages and is not suitable for production.
 * All queue state is lost when the application restarts.
 *
 * @example
 * ```typescript
 * // Register as a provider in your module
 * providers: [MemoryQueueService]
 * ```
 */
@Injectable()
export class MemoryQueueService implements QueueClient {
  private readonly logger = new Logger(MemoryQueueService.name);
  private subscribers = new Map<string, ((msg: any) => Promise<void>)[]>();

  /**
   * Publishes a message to a memory-based queue.
   * This implementation stores messages in memory and immediately notifies all registered handlers.
   *
   * @template T - The type of the message being published.
   * @param {string} queueName - The name of the queue to publish to.
   * @param {T} message - The message payload to publish.
   * @returns {Promise<PublishResponse>} A promise that resolves with a success message.
   *
   * @example
   * ```typescript
   * await memoryQueueService.publish('my-queue', { id: 1, content: 'Hello' });
   * ```
   */
  async publish<T>(queueName: string, message: T): Promise<PublishResponse> {
    await Promise.resolve();
    this.logger.log(
      `Publish to [${queueName}] (memory): ${JSON.stringify(message)}`,
    );
    const handlers = this.subscribers.get(queueName) || [];
    for (const handler of handlers) {
      handler(message).catch((err) =>
        this.logger.error(`Handler error for queue ${queueName}`, err),
      );
    }
    return { message: 'Message published in queue' };
  }

  /**
   * Subscribes a handler function to a memory-based queue.
   * The handler will be called immediately when messages are published to the queue.
   *
   * @param {string} queueName - The name of the queue to subscribe to.
   * @param {(message: any) => Promise<void>} handler - The async function to handle incoming messages.
   * @returns {Promise<SubscribeResponse>} A promise that resolves with a success message confirming the subscription.
   *
   * @example
   * ```typescript
   * await memoryQueueService.subscribe('my-queue', async (message) => {
   *   console.log('Received:', message);
   * });
   * ```
   */
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

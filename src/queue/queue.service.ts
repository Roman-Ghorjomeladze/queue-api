// src/queue/queue.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { QUEUE_CLIENT } from './queue.token';
import * as queueInterface from './queue.interface';
import { SubscribeQueueDto } from './dto/subscribe-queue.dto';
import { CreateQueueMessageADto } from './dto/create-queue-message.dto';

/**
 * Service for publishing and subscribing to queues.
 * Abstracts queue operations across different queue implementations (Memory, SQS, RabbitMQ).
 *
 * @example
 * ```typescript
 * // Inject in your service
 * constructor(private readonly queueService: QueueService) {}
 *
 * // Publish a message
 * await this.queueService.publish({
 *   queueName: 'my-queue',
 *   message: { id: 1, content: 'Hello' }
 * });
 *
 * // Subscribe to a queue
 * await this.queueService.subscribe({ queueName: 'my-queue' });
 * ```
 */
@Injectable()
export class QueueService {
  constructor(
    @Inject(QUEUE_CLIENT) private readonly queue: queueInterface.QueueClient,
  ) {}

  /**
   * Publishes a message to the specified queue.
   *
   * @param {CreateQueueMessageADto} message - The message DTO containing queueName and message payload.
   * @returns {Promise<PublishResponse>} A promise that resolves with the publish response containing a success message.
   * @throws {Error} Throws an error if the queue client fails to publish the message.
   *
   * @example
   * ```typescript
   * await queueService.publish({
   *   queueName: 'my-queue',
   *   message: { id: 1, content: 'Hello World' }
   * });
   * ```
   */
  async publish(message: CreateQueueMessageADto) {
    return await this.queue.publish(message.queueName, message.message);
  }

  /**
   * Subscribes to a queue and registers a handler function to process incoming messages.
   *
   * @param {SubscribeQueueDto} payload - The subscription DTO containing the queue name to subscribe to.
   * @returns {Promise<SubscribeResponse>} A promise that resolves with the subscription response containing a success message.
   * @throws {Error} Throws an error if the queue client fails to subscribe to the queue.
   *
   * @example
   * ```typescript
   * await queueService.subscribe({
   *   queueName: 'my-queue'
   * });
   * ```
   */
  async subscribe(payload: SubscribeQueueDto) {
    return await this.queue.subscribe(payload.queueName, async (message) => {
      await Promise.resolve();
      console.log('Message has been published: ', message);
    });
  }
}

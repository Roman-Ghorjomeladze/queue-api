import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  PublishResponse,
  QueueClient,
  SubscribeResponse,
} from '../queue.interface';
import { connect, Channel, ChannelModel } from 'amqplib';

/**
 * RabbitMQ queue implementation for production use.
 * Supports durable queues and persistent messages.
 *
 * @remarks
 * Requires a running RabbitMQ server.
 * Uses environment variables:
 * - RABBITMQ_URL (optional, full connection string)
 * - RABBITMQ_HOST (defaults to 'localhost', use 'rabbitmq' for Docker)
 * - RABBITMQ_PORT (defaults to '5672')
 * - RABBITMQ_USERNAME (defaults to 'admin')
 * - RABBITMQ_PASSWORD (defaults to 'admin')
 *
 * @example
 * ```typescript
 * // Register as a provider in your module
 * providers: [RabbitMqQueueService]
 * ```
 */
@Injectable()
export class RabbitMqQueueService implements QueueClient, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqQueueService.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  /**
   * Ensures a RabbitMQ channel is available, creating and caching it if necessary.
   * Uses the RABBITMQ_URL environment variable or defaults to 'amqp://rabbitmq:5672'.
   *
   * @private
   * @returns {Promise<Channel>} A promise that resolves with the RabbitMQ channel.
   * @throws {Error} Throws if connection to RabbitMQ fails.
   *
   * @example
   * ```typescript
   * const channel = await this.ensureChannel();
   * ```
   */
  private async ensureChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    // Build RabbitMQ URL with credentials support
    let url = process.env.RABBITMQ_URL;
    if (!url) {
      const username = process.env.RABBITMQ_USERNAME || 'admin';
      const password = process.env.RABBITMQ_PASSWORD || 'admin';
      const host = process.env.RABBITMQ_HOST || 'localhost';
      const port = process.env.RABBITMQ_PORT || '5672';
      url = `amqp://${username}:${password}@${host}:${port}`;
    }
    this.logger.log(
      `Connecting to RabbitMQ at ${url.replace(/:[^:@]+@/, ':****@')}`,
    );
    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();
    return this.channel;
  }

  /**
   * Publishes a message to a RabbitMQ queue.
   * The queue is created if it doesn't exist, and messages are marked as persistent.
   * The message is serialized as JSON before being sent to RabbitMQ.
   *
   * @template T - The type of the message being published.
   * @param {string} queueName - The name of the RabbitMQ queue to publish to.
   * @param {T} message - The message payload to publish.
   * @returns {Promise<PublishResponse>} A promise that resolves with a success message.
   * @throws {Error} Throws if connection to RabbitMQ fails or if publish operation fails.
   *
   * @example
   * ```typescript
   * await rabbitMqQueueService.publish('my-queue', { id: 1, content: 'Hello' });
   * ```
   */
  async publish<T>(queueName: string, message: T): Promise<PublishResponse> {
    const channel = await this.ensureChannel();
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    const feedback = `RabbitMQ publish to [${queueName}]`;
    this.logger.log(feedback);
    return { message: feedback };
  }

  /**
   * Subscribes to a RabbitMQ queue and registers a handler function for incoming messages.
   * The queue is created if it doesn't exist. Messages are acknowledged after successful processing
   * or negatively acknowledged on handler errors.
   *
   * @param {string} queueName - The name of the RabbitMQ queue to subscribe to.
   * @param {(message: unknown) => Promise<void>} handler - The async function to handle incoming messages.
   * @returns {Promise<SubscribeResponse>} A promise that resolves with a success message confirming the subscription.
   * @throws {Error} Throws if connection to RabbitMQ fails or if subscription fails.
   *
   * @remarks
   * Handler errors are logged and the message is negatively acknowledged (not requeued).
   * Messages are parsed as JSON from the RabbitMQ message body.
   *
   * @example
   * ```typescript
   * await rabbitMqQueueService.subscribe('my-queue', async (message) => {
   *   console.log('Received:', message);
   * });
   * ```
   */
  async subscribe(
    queueName: string,
    handler: (message: unknown) => Promise<void>,
  ): Promise<SubscribeResponse> {
    const channel = await this.ensureChannel();
    await channel.assertQueue(queueName, { durable: true });
    await channel.consume(queueName, (msg) => {
      if (!msg) return;

      void (async () => {
        try {
          const body: unknown = JSON.parse(msg.content.toString());
          await handler(body);
          channel.ack(msg);
        } catch (err) {
          this.logger.error(`Handler error for RabbitMQ`, err);
          channel.nack(msg, false, false);
        }
      })();
    });
    const feedback = `Subscribed to RabbitMQ queue [${queueName}]`;
    this.logger.log(feedback);
    return { message: feedback };
  }

  /**
   * Cleans up RabbitMQ connections and channels when the module is destroyed.
   * This method is automatically called by NestJS during application shutdown.
   *
   * @returns {Promise<void>} A promise that resolves when cleanup is complete.
   *
   * @remarks
   * Safely closes the channel and connection, ignoring any errors that occur during cleanup.
   */
  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}

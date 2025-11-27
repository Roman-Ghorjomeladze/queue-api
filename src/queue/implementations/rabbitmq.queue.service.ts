import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  PublishResponse,
  QueueClient,
  SubscribeResponse,
} from '../queue.interface';
import { connect, Channel, ChannelModel } from 'amqplib';

@Injectable()
export class RabbitMqQueueService implements QueueClient, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqQueueService.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  private async ensureChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    const url = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    this.logger.log(`Connecting to RabbitMQ at ${url}`);
    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();
    return this.channel;
  }

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

  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}

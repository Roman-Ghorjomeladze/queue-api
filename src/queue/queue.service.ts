// src/queue/queue.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { QUEUE_CLIENT } from './queue.token';
import * as queueInterface from './queue.interface';
import { SubscribeQueueDto } from './dto/subscribe-queue.dto';
import { CreateQueueMessageADto } from './dto/create-queue-message.dto';

@Injectable()
export class QueueService {
  constructor(
    @Inject(QUEUE_CLIENT) private readonly queue: queueInterface.QueueClient,
  ) {}

  async publish(message: CreateQueueMessageADto) {
    return await this.queue.publish(message.queueName, message.message);
  }

  async subscribe(payload: SubscribeQueueDto) {
    return await this.queue.subscribe(payload.queueName, async (message) => {
      await Promise.resolve();
      console.log('Message has been published', message);
    });
  }
}

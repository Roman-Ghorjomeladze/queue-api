// src/queue/queue.module.ts
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { QueueClient } from './queue.interface';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

import { MemoryQueueService } from './implementations/memory.queue.service';
import { SqsQueueService } from './implementations/sqs.queue.service';
import { RabbitMqQueueService } from './implementations/rabbitmq.queue.service';
import { QUEUE_CLIENT } from './queue.token';

@Module({})
export class QueueModule {
  /**
   * Configures the QueueModule with all queue implementations and sets up dependency injection.
   * The queue provider is determined by the QUEUE_PROVIDER environment variable.
   *
   * @returns {DynamicModule} A configured dynamic module that exports QueueService and QUEUE_CLIENT token.
   *
   * @remarks
   * This method registers all three queue implementations (Memory, SQS, RabbitMQ) and uses a factory
   * to select the appropriate implementation based on the QUEUE_PROVIDER environment variable.
   * Supported values: 'memory' (default), 'sqs', 'rabbitmq'.
   * The module is configured as global, making it available throughout the application.
   *
   * @example
   * ```typescript
   * // In app.module.ts
   * @Module({
   *   imports: [
   *     ConfigModule.forRoot({ isGlobal: true }),
   *     QueueModule.forRoot(),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      global: true,
      imports: [ConfigModule],
      controllers: [QueueController],
      providers: [
        // Register all three implementations first — Nest will handle their own deps
        MemoryQueueService,
        SqsQueueService,
        RabbitMqQueueService,

        // This factory returns the correct instance based on config
        {
          provide: QUEUE_CLIENT,
          useFactory: (
            config: ConfigService,
            memory: MemoryQueueService,
            sqs: SqsQueueService,
            rabbit: RabbitMqQueueService,
          ): QueueClient => {
            const provider = (
              config.get<string>('QUEUE_PROVIDER') ?? 'memory'
            ).toLowerCase();

            console.log(
              `[QueueModule] Using queue provider: ${provider.toUpperCase()}`,
            );

            if (provider === 'sqs') return sqs;
            if (provider === 'rabbitmq') return rabbit;
            return memory; // default
          },
          inject: [
            ConfigService,
            MemoryQueueService,
            SqsQueueService,
            RabbitMqQueueService,
          ],
        },

        // Your service that uses the queue
        QueueService,
      ],
      exports: [QUEUE_CLIENT, QueueService],
    };
  }
}

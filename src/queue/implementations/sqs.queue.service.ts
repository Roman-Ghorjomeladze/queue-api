import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueUrlCommand,
  CreateQueueCommand,
} from '@aws-sdk/client-sqs';
import { Agent } from 'http';

import { isQueueMissing, isTimoutError } from '../utils/errors';
import { AppLogger } from 'src/common/logger/logger.service';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import {
  PublishResponse,
  QueueClient,
  SubscribeResponse,
} from '../queue.interface';

const createSqsClient = (configService: ConfigService): SQSClient => {
  const endpoint = configService.getOrThrow<string>('AWS_ENDPOINT_URL');

  return new SQSClient({
    region: configService.getOrThrow<string>('AWS_REGION'),
    credentials: {
      accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.getOrThrow<string>(
        'AWS_SECRET_ACCESS_KEY',
      ),
    },
    // THIS IS THE MAGIC — forces HTTP and fixes ::1/127.0.0.1 bug
    requestHandler: new NodeHttpHandler({
      httpAgent: new Agent({ keepAlive: true }),
      httpsAgent: new Agent({ keepAlive: true }),
      connectionTimeout: 5000,
      socketTimeout: 5000,
    }),
    endpoint: endpoint,
    tls: false,
    endpointProvider: () => ({ url: new URL(endpoint) }),
  });
};

/**
 * AWS SQS queue implementation for production use.
 * Supports long polling and automatic message deletion after processing.
 *
 * @remarks
 * Requires AWS credentials and SQS queue configuration.
 * Uses environment variables:
 * - AWS_REGION (defaults to 'us-east-1')
 * - AWS_ENDPOINT_URL (optional, for LocalStack: http://localhost:4566)
 * - AWS_ACCESS_KEY_ID (optional, for LocalStack: 'test')
 * - AWS_SECRET_ACCESS_KEY (optional, for LocalStack: 'test')
 *
 * @example
 * ```typescript
 * // Register as a provider in your module
 * providers: [SqsQueueService]
 * ```
 */
@Injectable()
export class SqsQueueService implements QueueClient, OnModuleDestroy {
  private readonly client: SQSClient;
  private readonly queueUrls = new Map<string, string>();

  constructor(
    private configService: ConfigService,
    private logger: AppLogger,
  ) {
    createSqsClient(this.configService);
  }
  /**
   * Retrieves the URL for an SQS queue, creating it if it doesn't exist.
   * Caches the result for subsequent calls.
   *
   * @private
   * @param {string} queueName - The name of the SQS queue.
   * @returns {Promise<string>} A promise that resolves with the queue URL.
   * @throws {Error} Throws an error if queue creation or retrieval fails.
   *
   * @remarks
   * Automatically creates the queue if it doesn't exist (useful for LocalStack).
   *
   * @example
   * ```typescript
   * const url = await this.getQueueUrl('my-queue');
   * ```
   */
  private async getQueueUrl(queueName: string): Promise<string> {
    const cached = this.queueUrls.get(queueName);
    if (cached) return cached;

    try {
      const { QueueUrl } = await this.client.send(
        new GetQueueUrlCommand({ QueueName: queueName }),
      );

      if (!QueueUrl) throw new Error('QueueUrl is missing in response');

      this.queueUrls.set(queueName, QueueUrl);
      this.logger.warn(`Using existing SQS queue: ${queueName} → ${QueueUrl}`);
      return QueueUrl;
    } catch (error: any) {
      // Correctly detect "queue does not exist"
      const queueNotFound: boolean = isQueueMissing(error);

      if (!queueNotFound) {
        this.logger.error(
          `Unexpected error getting queue URL for "${queueName}"`,
          error,
        );
        throw error;
      }

      this.logger.log(
        `Queue "${queueName}" does not exist. Creating it now...`,
      );

      try {
        const createResult = await this.client.send(
          new CreateQueueCommand({
            QueueName: queueName,
            Attributes: {
              VisibilityTimeout: '60',
              MessageRetentionPeriod: '345600', // 4 days
            },
          }),
        );

        if (!createResult.QueueUrl) {
          throw new Error('Failed to create queue: no QueueUrl returned');
        }

        this.logger.log(`Successfully created queue "${queueName}"`);
        this.queueUrls.set(queueName, createResult.QueueUrl);
        return createResult.QueueUrl;
      } catch (createError: any) {
        // If queue was created by another instance in parallel
        if ((createError as { name: string })?.name === 'QueueAlreadyExists') {
          this.logger.log(
            `Queue "${queueName}" already exists (race condition), fetching URL...`,
          );
          const { QueueUrl } = await this.client.send(
            new GetQueueUrlCommand({ QueueName: queueName }),
          );
          if (QueueUrl) {
            this.queueUrls.set(queueName, QueueUrl);
            return QueueUrl;
          }
        }
        throw createError;
      }
    }
  }

  /**
   * Publishes a message to an AWS SQS queue.
   * The message is serialized as JSON before being sent to SQS.
   *
   * @template T - The type of the message being published.
   * @param {string} queueName - The name of the SQS queue to publish to.
   * @param {T} message - The message payload to publish.
   * @returns {Promise<PublishResponse>} A promise that resolves with a success message.
   * @throws {Error} Throws if the queue does not exist or if the publish operation fails.
   *
   * @example
   * ```typescript
   * await sqsQueueService.publish('my-queue', { id: 1, content: 'Hello' });
   * ```
   */
  async publish<T>(queueName: string, message: T): Promise<PublishResponse> {
    const queueUrl = await this.getQueueUrl(queueName);

    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
      }),
    );
    const feedback = `SQS publish to [${queueName}]`;
    this.logger.log(feedback);
    return { message: feedback };
  }

  /**
   * Subscribes to an AWS SQS queue using long polling.
   * Continuously polls the queue for messages and invokes the handler for each received message.
   * Messages are automatically deleted after successful processing.
   *
   * @param {string} queueName - The name of the SQS queue to subscribe to.
   * @param {(message: unknown) => Promise<void>} handler - The async function to handle incoming messages.
   * @returns {Promise<SubscribeResponse>} A promise that resolves immediately with a success message.
   * @throws {Error} Throws if the queue does not exist or if subscription fails.
   *
   * @remarks
   * This method starts a background polling loop that continues until the service is destroyed.
   * The polling uses long polling with a 20-second wait time and handles up to 10 messages per batch.
   * Failed message processing is logged but does not stop the polling loop.
   *
   * @example
   * ```typescript
   * await sqsQueueService.subscribe('my-queue', async (message) => {
   *   console.log('Received:', message);
   * });
   * ```
   */
  async subscribe(
    queueName: string,
    handler: (message: unknown) => Promise<void>,
  ): Promise<SubscribeResponse> {
    const queueUrl = await this.getQueueUrl(queueName);

    const poll = async () => {
      while (true) {
        try {
          const response = await this.client.send(
            new ReceiveMessageCommand({
              QueueUrl: queueUrl,
              MaxNumberOfMessages: 10,
              WaitTimeSeconds: 20,
              VisibilityTimeout: 60,
            }),
          );

          for (const msg of response.Messages ?? []) {
            if (!msg.Body || !msg.ReceiptHandle) continue;

            let parsed: unknown;
            try {
              parsed = JSON.parse(msg.Body);
            } catch {
              parsed = msg.Body;
            }

            void (async () => {
              try {
                await handler(parsed);
                await this.client.send(
                  new DeleteMessageCommand({
                    QueueUrl: queueUrl,
                    ReceiptHandle: msg.ReceiptHandle!,
                  }),
                );
              } catch (err) {
                this.logger.error(
                  `Handler failed for queue ${queueName}`,
                  err instanceof Error ? err.stack : String(err),
                );
              }
            })();
          }
        } catch (err: any) {
          if (isTimoutError(err)) {
            this.logger.warn(`Long polling timeout (normal) — retrying...`);
            continue; // start next poll
          }

          this.logger.error(
            `Polling error on queue ${queueName}`,
            err instanceof Error ? err.stack : err,
          );

          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };

    void poll();
    const feedback = `Subscribed to SQS queue [${queueName}] (long polling)`;
    this.logger.log(feedback);
    return { message: feedback };
  }

  /**
   * Cleans up the SQS client when the module is destroyed.
   * This method is automatically called by NestJS during application shutdown.
   *
   * @returns {Promise<void>} A promise that resolves when cleanup is complete.
   */
  async onModuleDestroy(): Promise<void> {
    await Promise.resolve();
    this.client.destroy();
  }
}

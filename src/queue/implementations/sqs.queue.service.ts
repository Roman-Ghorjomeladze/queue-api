import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import {
  PublishResponse,
  QueueClient,
  SubscribeResponse,
} from '../queue.interface';

// Helper factory – this is the trick that makes TypeScript + ESLint happy
const createSqsClient = (): SQSClient =>
  new SQSClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
  });

@Injectable()
export class SqsQueueService implements QueueClient, OnModuleDestroy {
  private readonly logger = new Logger(SqsQueueService.name);
  private readonly client: SQSClient = createSqsClient(); // ← perfect inference
  private readonly queueUrls = new Map<string, string>();

  // … rest of the code exactly the same as before …
  private async getQueueUrl(queueName: string): Promise<string> {
    const cached = this.queueUrls.get(queueName);
    if (cached) return cached;

    const { QueueUrl } = await this.client.send(
      new GetQueueUrlCommand({ QueueName: queueName }),
    );

    if (!QueueUrl) {
      throw new Error(`SQS queue "${queueName}" does not exist`);
    }

    this.queueUrls.set(queueName, QueueUrl);
    return QueueUrl;
  }

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
          this.logger.error(`Polling error on queue ${queueName}`, err);
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };

    void poll();
    const feedback = `Subscribed to SQS queue [${queueName}] (long polling)`;
    this.logger.log(feedback);
    return { message: feedback };
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.resolve();
    this.client.destroy();
  }
}

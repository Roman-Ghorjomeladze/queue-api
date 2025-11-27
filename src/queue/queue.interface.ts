export interface PublishResponse {
  message: string;
}

export interface SubscribeResponse {
  message: string;
}

export interface QueueClient {
  publish<T>(queueName: string, message: T): Promise<PublishResponse>;
  subscribe(
    queueName: string,
    handler: (message: any) => Promise<void>,
  ): Promise<SubscribeResponse>;
}

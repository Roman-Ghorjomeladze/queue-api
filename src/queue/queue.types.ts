export type QueueProviderType = 'sqs' | 'rabbitmq' | 'memory';

export interface NamedQueueProvider {
  name: string; // e.g. 'sqs', 'rabbit'
  type: QueueProviderType;
}

export interface QueueModuleOptions {
  defaultProvider: QueueProviderType;
  namedProviders?: NamedQueueProvider[];
}

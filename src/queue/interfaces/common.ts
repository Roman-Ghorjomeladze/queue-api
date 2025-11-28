export enum AllowedQueueProviders {
  AWS_SQS = 'sqs',
  RABBITMQ = 'rabbitmq',
  LOCAL = 'local',
}

export interface PollingTimeoutError {
  name?: string;
  message?: string;
  code?: string;
}

export interface QueueNotExistsError {
  name?: string;
  Code?: string;
  message?: string;
  $metadata?: { httpStatusCode?: number };
}

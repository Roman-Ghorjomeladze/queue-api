export const QUEUE_SERVICE = 'QUEUE_SERVICE';

export const QUEUE_CLIENT = 'QUEUE_CLIENT';

export const getQueueToken = (name: string) =>
  `QUEUE_SERVICE_${name.toUpperCase()}`;

import { AllowedQueueProviders } from '../interfaces/common';

/**
 * Checks if the queu provider string is valid and returns the enum value for type safety
 *
 * @param {String} provider - The queue provider string from enum
 * @returns {AllowedQueueProviders} Enum value according to the queue provider env variable
 *
 */
export const validateAndGetQueueProvider = (
  provider: string | undefined,
): AllowedQueueProviders => {
  switch (provider as AllowedQueueProviders) {
    case AllowedQueueProviders.AWS_SQS:
      return AllowedQueueProviders.AWS_SQS;
    case AllowedQueueProviders.RABBITMQ:
      return AllowedQueueProviders.RABBITMQ;
    default:
      return AllowedQueueProviders.LOCAL;
  }
};

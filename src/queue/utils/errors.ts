import { PollingTimeoutError, QueueNotExistsError } from '../interfaces/common';

/**
 * Determines whether the provided value represents a polling timeout or connection-related timeout error.
 *
 * Performs a best-effort runtime inspection of an unknown value (typically an Error or error-like object)
 * and returns true when the value exhibits common timeout/connection-reset indicators.
 *
 * @param err - The value to inspect; usually an Error or an object with error-like properties.
 * @returns `true` if the supplied value appears to be a timeout or connection reset error; otherwise `false`.
 *
 */
export const isTimoutError = (err: unknown): boolean => {
  const error: PollingTimeoutError = err as PollingTimeoutError;
  return (
    error.name === 'TimeoutError' ||
    error.message?.includes('inactivity') ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT'
  );
};

/**
 * Determines whether the provided error represents a missing (non-existent) SQS queue.
 *
 * This helper accepts an unknown error value and performs a set of runtime checks that
 * are commonly used to detect the "queue does not exist" condition returned by AWS SDKs
 * or custom error shapes.
 *
 * These checks are intentionally defensive (safe property access) because the input is `unknown`.
 *
 * @param err - The error value to inspect (may be any type). The function will attempt safe property reads to determine the error shape.
 * @returns `true` if the error appears to indicate a non-existent SQS queue; otherwise `false`.
 *
 */
export const isQueueMissing = (err: unknown): boolean => {
  const error: QueueNotExistsError = err as QueueNotExistsError;
  return (
    error.name === 'QueueDoesNotExist' ||
    error.Code === 'AWS.SimpleQueueService.NonExistentQueue' ||
    error.message?.includes('does not exist') ||
    error?.$metadata?.httpStatusCode === 400
  );
};

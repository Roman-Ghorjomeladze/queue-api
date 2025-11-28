import {
  Controller,
  Post,
  Body,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueMessageADto } from './dto/create-queue-message.dto';
import { SubscribeQueueDto } from './dto/subscribe-queue.dto';

/**
 * Controller for handling queue-related HTTP endpoints.
 * Provides REST API endpoints for publishing messages and subscribing to queues.
 *
 * @example
 * ```typescript
 * // Publish a message
 * POST /queue/publish
 * Body: { "queueName": "my-queue", "message": { "id": 1, "content": "Hello" } }
 *
 * // Subscribe to a queue
 * POST /queue/subscribe
 * Body: { "queueName": "my-queue" }
 * ```
 */
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Publishes a message to a queue via HTTP POST request.
   *
   * @route POST /queue/publish
   * @param {CreateQueueMessageADto} message - The message DTO containing queueName and message payload from request body.
   * @returns {Promise<PublishResponse>} A promise that resolves with the publish response containing a success message.
   * @throws {HttpException} Re-throws any HttpException from the service layer.
   * @throws {InternalServerErrorException} Throws a 500 error if publishing fails with a non-HTTP error.
   *
   * @example
   * POST /queue/publish
   * Body: {
   *   "queueName": "my-queue",
   *   "message": { "id": 1, "content": "Hello World" }
   * }
   */
  @Post('/publish')
  async publishMessage(@Body() message: CreateQueueMessageADto) {
    try {
      return await this.queueService.publish(message);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to publish message to queue',
      );
    }
  }

  /**
   * Subscribes to a queue via HTTP POST request.
   *
   * @route POST /queue/subscribe
   * @param {SubscribeQueueDto} payload - The subscription DTO containing the queue name from request body.
   * @returns {Promise<SubscribeResponse>} A promise that resolves with the subscription response containing a success message.
   * @throws {HttpException} Re-throws any HttpException from the service layer.
   * @throws {InternalServerErrorException} Throws a 500 error if subscription fails with a non-HTTP error.
   *
   * @example
   * POST /queue/subscribe
   * Body: {
   *   "queueName": "my-queue"
   * }
   */
  @Post('/subscribe')
  async subscribeToQueue(@Body() payload: SubscribeQueueDto) {
    try {
      return await this.queueService.subscribe(payload);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to subscribe to queue');
    }
  }
}

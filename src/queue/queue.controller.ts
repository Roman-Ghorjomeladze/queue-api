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

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('/publish')
  publishMessage(@Body() message: CreateQueueMessageADto) {
    try {
      return this.queueService.publish(message);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to publish message to queue',
      );
    }
  }

  @Post('/subscribe')
  subscribeToQueue(@Body() payload: SubscribeQueueDto) {
    try {
      return this.queueService.subscribe(payload);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to publish message to queue',
      );
    }
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { CreateQueueMessageADto } from './dto/create-queue-message.dto';
import { SubscribeQueueDto } from './dto/subscribe-queue.dto';

/* eslint-disable @typescript-eslint/unbound-method */

describe('QueueController', () => {
  let controller: QueueController;
  let queueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    // Create a mock QueueService
    const mockQueueService = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
    queueService = module.get(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('publishMessage', () => {
    it('should publish a message successfully', async () => {
      const messageDto: CreateQueueMessageADto = {
        queueName: 'test-queue',
        message: { content: 'test message' },
      };
      const expectedResponse = { message: 'Message published successfully' };
      queueService.publish.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.publishMessage(messageDto);

      // Assert
      expect(queueService.publish).toHaveBeenCalledWith(messageDto);
      expect(queueService.publish).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle different message types', async () => {
      const stringMessage: CreateQueueMessageADto = {
        queueName: 'string-queue',
        message: 'simple string',
      };
      const objectMessage: CreateQueueMessageADto = {
        queueName: 'object-queue',
        message: { key: 'value' },
      };

      queueService.publish.mockResolvedValue({ message: 'Published' });

      await controller.publishMessage(stringMessage);
      expect(queueService.publish).toHaveBeenCalledWith(stringMessage);

      await controller.publishMessage(objectMessage);
      expect(queueService.publish).toHaveBeenCalledWith(objectMessage);
    });

    it('should throw HttpException when service throws HttpException', async () => {
      const messageDto: CreateQueueMessageADto = {
        queueName: 'error-queue',
        message: 'test',
      };
      const httpException = new HttpException('Queue not found', 404);
      queueService.publish.mockRejectedValue(httpException);

      await expect(controller.publishMessage(messageDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.publishMessage(messageDto)).rejects.toThrow(
        'Queue not found',
      );
      expect(queueService.publish).toHaveBeenCalledWith(messageDto);
    });

    it('should throw InternalServerErrorException when service throws non-HttpException', async () => {
      const messageDto: CreateQueueMessageADto = {
        queueName: 'error-queue',
        message: 'test',
      };
      const genericError = new Error('Unexpected error');
      queueService.publish.mockRejectedValue(genericError);

      await expect(controller.publishMessage(messageDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.publishMessage(messageDto)).rejects.toThrow(
        'Failed to publish message to queue',
      );
      expect(queueService.publish).toHaveBeenCalledWith(messageDto);
    });

    it('should handle publish service errors gracefully', async () => {
      const messageDto: CreateQueueMessageADto = {
        queueName: 'error-queue',
        message: 'test',
      };
      const error = new Error('Service error');
      queueService.publish.mockRejectedValue(error);

      try {
        await controller.publishMessage(messageDto);
        fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
        expect((err as InternalServerErrorException).message).toBe(
          'Failed to publish message to queue',
        );
      }
    });
  });

  describe('subscribeToQueue', () => {
    it('should subscribe to a queue successfully', async () => {
      const subscribeDto: SubscribeQueueDto = {
        queueName: 'test-queue',
      };
      const expectedResponse = { message: 'Subscribed successfully' };
      queueService.subscribe.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.subscribeToQueue(subscribeDto);

      // Assert
      expect(queueService.subscribe).toHaveBeenCalledWith(subscribeDto);
      expect(queueService.subscribe).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle different queue names', async () => {
      const queues = [
        { queueName: 'queue-1' },
        { queueName: 'queue-2' },
        { queueName: 'queue-3' },
      ];
      queueService.subscribe.mockResolvedValue({ message: 'Subscribed' });

      // Act
      for (const queue of queues) {
        await controller.subscribeToQueue(queue);
      }

      // Assert
      expect(queueService.subscribe).toHaveBeenCalledTimes(queues.length);
      queues.forEach((queue) => {
        expect(queueService.subscribe).toHaveBeenCalledWith(queue);
      });
    });

    it('should throw HttpException when service throws HttpException', async () => {
      const subscribeDto: SubscribeQueueDto = {
        queueName: 'error-queue',
      };
      const httpException = new HttpException('Queue not found', 404);
      queueService.subscribe.mockRejectedValue(httpException);

      await expect(controller.subscribeToQueue(subscribeDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.subscribeToQueue(subscribeDto)).rejects.toThrow(
        'Queue not found',
      );
      expect(queueService.subscribe).toHaveBeenCalledWith(subscribeDto);
    });

    it('should throw InternalServerErrorException when service throws non-HttpException', async () => {
      const subscribeDto: SubscribeQueueDto = {
        queueName: 'error-queue',
      };
      const genericError = new Error('Unexpected error');
      queueService.subscribe.mockRejectedValue(genericError);

      await expect(controller.subscribeToQueue(subscribeDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.subscribeToQueue(subscribeDto)).rejects.toThrow(
        'Failed to subscribe to queue',
      );
      expect(queueService.subscribe).toHaveBeenCalledWith(subscribeDto);
    });

    it('should handle subscribe service errors gracefully', async () => {
      const subscribeDto: SubscribeQueueDto = {
        queueName: 'error-queue',
      };
      const error = new Error('Service error');
      queueService.subscribe.mockRejectedValue(error);

      try {
        await controller.subscribeToQueue(subscribeDto);
        fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
        expect((err as InternalServerErrorException).message).toBe(
          'Failed to subscribe to queue',
        );
      }
    });
  });
});

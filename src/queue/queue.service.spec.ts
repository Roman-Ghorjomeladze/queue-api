import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { QUEUE_CLIENT } from './queue.token';
import { QueueClient } from './queue.interface';
import { CreateQueueMessageADto } from './dto/create-queue-message.dto';
import { SubscribeQueueDto } from './dto/subscribe-queue.dto';

/* eslint-disable @typescript-eslint/unbound-method */

describe('QueueService', () => {
  let service: QueueService;
  let mockQueueClient: jest.Mocked<QueueClient>;

  beforeEach(async () => {
    // Create a mock QueueClient
    mockQueueClient = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: QUEUE_CLIENT,
          useValue: mockQueueClient,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should publish a message to the queue', async () => {
      const messageDto: CreateQueueMessageADto = {
        queueName: 'test-queue',
        message: { content: 'test message' },
      };
      const expectedResponse = { message: 'Message published successfully' };
      mockQueueClient.publish.mockResolvedValue(expectedResponse);

      const result = await service.publish(messageDto);

      expect(mockQueueClient.publish).toHaveBeenCalledWith(
        messageDto.queueName,
        messageDto.message,
      );
      expect(mockQueueClient.publish).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle different message types', async () => {
      const stringMessage: CreateQueueMessageADto = {
        queueName: 'string-queue',
        message: 'simple string message',
      };
      const objectMessage: CreateQueueMessageADto = {
        queueName: 'object-queue',
        message: { key: 'value', nested: { data: 123 } },
      };
      const arrayMessage: CreateQueueMessageADto = {
        queueName: 'array-queue',
        message: [1, 2, 3, 'four'],
      };

      mockQueueClient.publish.mockResolvedValue({
        message: 'Message published',
      });

      await service.publish(stringMessage);
      expect(mockQueueClient.publish).toHaveBeenCalledWith(
        'string-queue',
        'simple string message',
      );

      await service.publish(objectMessage);
      expect(mockQueueClient.publish).toHaveBeenCalledWith('object-queue', {
        key: 'value',
        nested: { data: 123 },
      });

      await service.publish(arrayMessage);
      expect(mockQueueClient.publish).toHaveBeenCalledWith('array-queue', [
        1,
        2,
        3,
        'four',
      ]);
    });

    it('should propagate errors from queue client', async () => {
      const messageDto: CreateQueueMessageADto = {
        queueName: 'error-queue',
        message: 'test',
      };
      const error = new Error('Queue publish failed');
      mockQueueClient.publish.mockRejectedValue(error);

      await expect(service.publish(messageDto)).rejects.toThrow(error);
      expect(mockQueueClient.publish).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to a queue', async () => {
      const subscribeDto: SubscribeQueueDto = {
        queueName: 'test-queue',
      };
      const expectedResponse = {
        message: 'Subscribed successfully',
      };
      mockQueueClient.subscribe.mockResolvedValue(expectedResponse);

      const result = await service.subscribe(subscribeDto);

      expect(mockQueueClient.subscribe).toHaveBeenCalledWith(
        subscribeDto.queueName,
        expect.any(Function),
      );
      expect(mockQueueClient.subscribe).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should register a message handler when subscribing', async () => {
      const subscribeDto: SubscribeQueueDto = {
        queueName: 'handler-queue',
      };
      mockQueueClient.subscribe.mockResolvedValue({
        message: 'Subscribed',
      });

      await service.subscribe(subscribeDto);

      expect(mockQueueClient.subscribe).toHaveBeenCalledWith(
        'handler-queue',
        expect.any(Function),
      );

      // Verify the handler function logs messages
      const handlerFn = mockQueueClient.subscribe.mock.calls[0][1];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const testMessage = { id: 1, content: 'test' };

      await handlerFn(testMessage);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Message has been published: ',
        testMessage,
      );

      consoleSpy.mockRestore();
    });

    it('should handle handler errors gracefully', async () => {
      const subscribeDto: SubscribeQueueDto = {
        queueName: 'error-handler-queue',
      };
      mockQueueClient.subscribe.mockResolvedValue({
        message: 'Subscribed',
      });

      await service.subscribe(subscribeDto);

      const handlerFn = mockQueueClient.subscribe.mock.calls[0][1];
      const testMessage = { id: 1, content: 'test' };

      // Handler should not throw even if processing fails
      await expect(handlerFn(testMessage)).resolves.not.toThrow();
    });

    it('should propagate errors from queue client subscription', async () => {
      const subscribeDto: SubscribeQueueDto = {
        queueName: 'error-queue',
      };
      const error = new Error('Subscription failed');
      mockQueueClient.subscribe.mockRejectedValue(error);

      await expect(service.subscribe(subscribeDto)).rejects.toThrow(error);
      expect(mockQueueClient.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should handle different queue names', async () => {
      const queues = ['queue-1', 'queue-2', 'queue-3'];
      mockQueueClient.subscribe.mockResolvedValue({
        message: 'Subscribed',
      });

      for (const queueName of queues) {
        await service.subscribe({ queueName });
      }

      expect(mockQueueClient.subscribe).toHaveBeenCalledTimes(queues.length);
      queues.forEach((queueName) => {
        expect(mockQueueClient.subscribe).toHaveBeenCalledWith(
          queueName,
          expect.any(Function),
        );
      });
    });
  });
});

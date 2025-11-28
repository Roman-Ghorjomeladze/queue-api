import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('/health', () => {
    it('should return success', () => {
      expect(appController.getHealth()).toEqual({
        status: 'Up and Running!!!',
        timestamp: expect.any(String) as unknown as string,
      });
    });
  });
});

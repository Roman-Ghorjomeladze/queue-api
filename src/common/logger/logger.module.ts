import { Module, Global, Scope } from '@nestjs/common';
import { AppLogger } from './logger.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './logger.interceptor';

@Global()
@Module({
  providers: [
    AppLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
      scope: Scope.REQUEST,
    },
  ],
  exports: [AppLogger],
})
export class LoggerModule {}

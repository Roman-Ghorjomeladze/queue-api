import { Module, Global, Scope } from '@nestjs/common';

import { LoggerInterceptor } from './logger.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppLogger } from './logger.service';

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

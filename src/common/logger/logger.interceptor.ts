import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLogger } from './logger.service';
import { randomUUID } from 'crypto';
import { Request } from 'express';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const traceId = randomUUID();
    this.logger.setTraceId(traceId);

    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;

    this.logger.log(`Incoming request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`Request completed: ${method} ${url}`);
      }),
    );
  }
}

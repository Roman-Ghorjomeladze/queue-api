import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck(): { status: string; timestamp: string } {
    return { status: 'Up and Running!!!', timestamp: new Date().toISOString() };
  }
}

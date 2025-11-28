import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubscribeQueueDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  queueName: string;
}

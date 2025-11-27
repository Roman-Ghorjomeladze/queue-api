import { IsNotEmpty, IsString } from 'class-validator';

export class SubscribeQueueDto {
  @IsNotEmpty()
  @IsString()
  queueName: string;
}

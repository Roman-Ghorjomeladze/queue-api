import { IsNotEmpty, IsString } from 'class-validator';

export class CreateQueueMessageADto {
  @IsNotEmpty()
  @IsString()
  queueName: string;

  @IsNotEmpty()
  message: unknown;
}

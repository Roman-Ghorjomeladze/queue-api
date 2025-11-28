import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQueueMessageADto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  queueName: string;

  @ApiProperty()
  @IsNotEmpty()
  message: unknown;
}

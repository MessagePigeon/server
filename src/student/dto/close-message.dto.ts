import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CloseMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  messageId: number;
}

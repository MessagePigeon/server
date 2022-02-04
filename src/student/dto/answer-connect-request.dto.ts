import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerConnectRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  requestId: string;
}

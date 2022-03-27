import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CloseMessageByTeacherDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  messageId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  studentId: string;
}

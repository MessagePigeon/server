import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteStudentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  studentId: string;
}

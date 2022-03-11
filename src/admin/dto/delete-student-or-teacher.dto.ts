import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteStudentOrTeacherDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}

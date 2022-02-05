import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ModifyConnectionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;
}

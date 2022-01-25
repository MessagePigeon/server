import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ResetTeacherPasswordDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class BanStudentOrTeacherDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'ban or unban' })
  @IsNotEmpty()
  @IsBoolean()
  ban: boolean;
}

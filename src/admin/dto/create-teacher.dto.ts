import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  fullName: string;
}

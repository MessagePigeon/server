import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StudentLoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;
}

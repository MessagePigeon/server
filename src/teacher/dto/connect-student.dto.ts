import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectStudentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  connectCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  remark: string;
}

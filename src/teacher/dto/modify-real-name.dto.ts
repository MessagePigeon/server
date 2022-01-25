import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class modifyRealNameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  newRealName: string;
}

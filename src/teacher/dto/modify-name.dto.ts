import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class modifyNameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  newName: string;
}

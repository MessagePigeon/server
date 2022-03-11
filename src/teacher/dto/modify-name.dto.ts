import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ModifyNameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  newName: string;
}

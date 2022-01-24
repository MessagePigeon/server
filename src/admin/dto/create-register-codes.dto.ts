import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRegisterCodesDto {
  @ApiProperty({ required: false, default: 1 })
  @IsNotEmpty()
  @IsNumber()
  count: number;
}

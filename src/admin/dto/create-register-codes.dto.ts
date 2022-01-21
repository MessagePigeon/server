import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateRegisterCodesDto {
  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  count: number;
}

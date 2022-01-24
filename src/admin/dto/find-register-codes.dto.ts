import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class FindRegisterCodeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  skip: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  take: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBooleanString()
  used: boolean;
}

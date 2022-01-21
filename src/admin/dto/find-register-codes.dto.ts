import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString, IsNumberString, IsOptional } from 'class-validator';

export class FindRegisterCodeDto {
  @ApiProperty()
  @IsNumberString()
  skip: number;

  @ApiProperty()
  @IsNumberString()
  take: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBooleanString()
  used: boolean;
}

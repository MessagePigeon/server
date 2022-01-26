import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';

export class PaginationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  skip: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  take: number;
}

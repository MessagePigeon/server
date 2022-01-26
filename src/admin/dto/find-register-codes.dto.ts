import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString, IsOptional } from 'class-validator';
import { PaginationDto } from '~/common/dto/pagination.dto';

export class FindRegisterCodeDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBooleanString()
  used: boolean;
}

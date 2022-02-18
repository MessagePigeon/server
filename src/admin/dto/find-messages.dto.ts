import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '~/common/dto/pagination.dto';

export class FindMessagesDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  teacherId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  studentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startTime: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endTime: string;
}

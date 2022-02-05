import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
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
}

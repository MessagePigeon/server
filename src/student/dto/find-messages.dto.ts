import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '~/common/dto/pagination.dto';

export class FindMessagesDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  teacherId: string;

  @ApiProperty({ required: false, description: 'part of message content' })
  @IsOptional()
  @IsString()
  content: string;
}

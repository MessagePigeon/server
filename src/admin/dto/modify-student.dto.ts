import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ModifyStudentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  key: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultRemark: string;
}

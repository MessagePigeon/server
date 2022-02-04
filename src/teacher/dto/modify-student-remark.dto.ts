import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ModifyStudentRemarkDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  newRemark: string;
}

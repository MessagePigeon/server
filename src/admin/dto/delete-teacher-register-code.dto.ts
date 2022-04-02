import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';

export class DeleteTeacherRegisterCodeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  id: number;
}

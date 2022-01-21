import { ApiProperty } from '@nestjs/swagger';

export class RegisterTeacherDto {
  @ApiProperty()
  readonly username: string;

  @ApiProperty()
  readonly password: string;

  @ApiProperty()
  readonly fullName: string;

  @ApiProperty()
  readonly registerCode: string;
}

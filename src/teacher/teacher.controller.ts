import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterTeacherDto } from './dto/register-teacher.dto';
import { TeacherService } from './teacher.service';

@Controller('teacher')
@ApiTags('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register teacher' })
  async registerTeacher(
    @Body(new ValidationPipe())
    { registerCode, username, password, fullName }: RegisterTeacherDto,
  ) {
    const isRegisterCodeStatusValid =
      await this.teacherService.checkRegisterCodeValid(registerCode);
    if (isRegisterCodeStatusValid) {
      const isUsernameRepeated =
        await this.teacherService.checkUserNameRepeated(username);
      if (!isUsernameRepeated) {
        await this.teacherService.updateRegisterCode(registerCode);
        return await this.teacherService.createTeacher(
          username,
          password,
          fullName,
        );
      } else {
        throw new HttpException('Username Repeated', HttpStatus.FORBIDDEN);
      }
    } else {
      throw new HttpException(
        'Register Code Not Valid',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}

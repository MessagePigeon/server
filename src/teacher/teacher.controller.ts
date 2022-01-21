import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
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
  async registerTeacher(@Body() registerTeacherDto: RegisterTeacherDto) {
    const registerCodeStatus = await this.teacherService.checkRegisterCode(
      registerTeacherDto.registerCode,
    );
    if (registerCodeStatus) {
      return await this.teacherService.register(
        registerTeacherDto.username,
        registerTeacherDto.password,
        registerTeacherDto.fullName,
      );
    } else {
      return new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}

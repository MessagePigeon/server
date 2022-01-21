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
    const registerCodeStatus = await this.teacherService.checkRegisterCode(
      registerCode,
    );
    if (registerCodeStatus) {
      return await this.teacherService.register(username, password, fullName);
    } else {
      return new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}

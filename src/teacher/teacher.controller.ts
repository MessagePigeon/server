import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
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
    this.teacherService.register(registerCode, username, password, fullName);
  }
}

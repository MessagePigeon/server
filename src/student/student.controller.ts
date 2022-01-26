import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { StudentAuthGuard } from '~/common/guards/student-auth.guard';
import { StudentLoginDto } from './dto/student-login.dto';
import { StudentService } from './student.service';
import { StudentAuthGuardRequest } from './types/student-auth-guard-request.type';

@ApiTags('student')
@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with key' })
  async login(@Body(new ValidationPipe()) { key }: StudentLoginDto) {
    const isKeyExist = await this.studentService.checkKeyExist(key);
    if (isKeyExist) {
      const id = await this.studentService.findIdByKey(key);
      return this.authService.generateStudentJwt(id);
    } else {
      throw new HttpException('Key Not Found', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('init')
  @UseGuards(StudentAuthGuard)
  async init(@Req() req: StudentAuthGuardRequest) {
    return await this.studentService.init(req.user.id);
  }
}

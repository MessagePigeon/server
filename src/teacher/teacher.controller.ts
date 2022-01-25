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
import { TeacherAuthGuard } from '~~/guards/teacher-auth.guard';
import { LoginTeacherDto } from './dto/login-teacher.dto';
import { RegisterTeacherDto } from './dto/register-teacher.dto';
import { TeacherService } from './teacher.service';
import { TeacherAuthGuardRequest } from './types/teacher-auth-guard-request.type';

@Controller('teacher')
@ApiTags('teacher')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register teacher' })
  async register(
    @Body(new ValidationPipe())
    { registerCode, username, password, realName }: RegisterTeacherDto,
  ) {
    const isRegisterCodeStatusValid =
      await this.teacherService.checkRegisterCodeValid(registerCode);
    if (isRegisterCodeStatusValid) {
      const isUsernameRepeated = await this.teacherService.checkUsernameExist(
        username,
      );
      if (!isUsernameRepeated) {
        await this.teacherService.updateRegisterCode(registerCode);
        return await this.teacherService.create(username, password, realName);
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

  @Post('login')
  @ApiOperation({})
  async login(
    @Body(new ValidationPipe()) { username, password }: LoginTeacherDto,
  ) {
    const isUserNameExist = await this.teacherService.checkUsernameExist(
      username,
    );
    if (isUserNameExist) {
      const isPasswordCorrect = await this.teacherService.checkPasswordHash(
        username,
        password,
      );
      if (isPasswordCorrect) {
        const id = await this.teacherService.getId(username);
        return await this.authService.generateTeacherJwt(id);
      } else {
        throw new HttpException('Password Incorrect', HttpStatus.UNAUTHORIZED);
      }
    } else {
      throw new HttpException('Username Not Found', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('init')
  @UseGuards(TeacherAuthGuard)
  @ApiOperation({ summary: 'Init with jwt header' })
  async init(@Req() req: TeacherAuthGuardRequest) {
    return await this.teacherService.init(req.user.id);
  }
}

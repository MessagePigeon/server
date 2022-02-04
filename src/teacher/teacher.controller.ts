import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { TeacherAuthGuard } from '~/auth/guards/teacher-auth.guard';
import { AuthUserId } from '~/common/decorators/auth-user-id.decorator';
import { ConnectStudentDto } from './dto/connect-student.dto';
import { LoginTeacherDto } from './dto/login-teacher.dto';
import { ModifyPasswordDto } from './dto/modify-password.dto';
import { modifyRealNameDto } from './dto/modify-real-name.dto';
import { ModifyStudentRemarkDto } from './dto/modify-student-remark.dto';
import { RegisterTeacherDto } from './dto/register-teacher.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TeacherService } from './teacher.service';

@Controller('teacher')
@ApiTags('teacher')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
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
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ValidationPipe()) { username, password }: LoginTeacherDto,
  ) {
    const isUserNameExist = await this.teacherService.checkUsernameExist(
      username,
    );
    if (isUserNameExist) {
      const isPasswordCorrect = await this.teacherService.checkPasswordHash(
        { username },
        password,
      );
      if (isPasswordCorrect) {
        const id = await this.teacherService.getId(username);
        return await this.authService.signJwtWithId(id);
      } else {
        throw new HttpException('Password Incorrect', HttpStatus.UNAUTHORIZED);
      }
    } else {
      throw new HttpException('Username Not Found', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('init')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  @ApiOperation({ summary: 'Init with jwt header' })
  async init(@AuthUserId() userId: string) {
    return await this.teacherService.init(userId);
  }

  @Patch('real-name')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async modifyRealName(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe()) { newRealName }: modifyRealNameDto,
  ) {
    return await this.teacherService.modifyRealName(userId, newRealName);
  }

  @Patch('password')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async modifyPassword(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe()) { oldPassword, newPassword }: ModifyPasswordDto,
  ) {
    const isOldPasswordCorrect = await this.teacherService.checkPasswordHash(
      { id: userId },
      oldPassword,
    );
    if (isOldPasswordCorrect) {
      return await this.teacherService.modifyPassword(userId, newPassword);
    } else {
      throw new HttpException('Old Password Incorrect', HttpStatus.FORBIDDEN);
    }
  }

  @Post('connect-request')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async sendConnectRequest(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe()) { connectCode, remark }: ConnectStudentDto,
  ) {
    const student = this.teacherService.findStudentByConnectCode(connectCode);
    if (!student) {
      throw new HttpException('Connect Code Not Found', HttpStatus.NOT_FOUND);
    } else {
      const isStudentAlreadyConnected =
        await this.teacherService.checkStudentAlreadyConnected(
          userId,
          student.id,
        );
      if (isStudentAlreadyConnected) {
        throw new HttpException(
          'Student Already Connected',
          HttpStatus.FORBIDDEN,
        );
      }
    }
    return await this.teacherService.connectStudent(userId, student, remark);
  }

  @Get('students')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async findStudents(@AuthUserId() userId: string) {
    return await this.teacherService.findStudents(userId);
  }

  @Post('message')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async sendMessage(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe())
    { studentIds, message, tts, closeDelay }: SendMessageDto,
  ) {
    return await this.teacherService.sendMessage(
      userId,
      studentIds,
      message,
      tts,
      closeDelay,
    );
  }

  @Patch('student/remark')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async modifyStudentRemark(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe())
    { studentId, newRemark }: ModifyStudentRemarkDto,
  ) {
    return await this.teacherService.modifyStudentRemark(
      userId,
      studentId,
      newRemark,
    );
  }
}

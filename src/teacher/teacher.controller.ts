import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { TeacherAuthGuard } from '~/auth/guards/teacher-auth.guard';
import { DEFAULT_SUCCESS_RESPONSE } from '~/common/constants';
import { AuthUserId } from '~/common/decorators/auth-user-id.decorator';
import { PaginationDto } from '~/common/dto/pagination.dto';
import { CloseMessageByTeacherDto } from './dto/close-message-by-teacher.dto';
import { ConnectStudentDto } from './dto/connect-student.dto';
import { DeleteStudentDto } from './dto/delete-student.dto';
import { LoginTeacherDto } from './dto/login-teacher.dto';
import { ModifyNameDto } from './dto/modify-name.dto';
import { ModifyPasswordDto } from './dto/modify-password.dto';
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
    { registerCode, username, password, name }: RegisterTeacherDto,
  ) {
    const isRegisterCodeStatusInvalid =
      await this.teacherService.checkRegisterCodeInvalid(registerCode);
    if (isRegisterCodeStatusInvalid) {
      throw new HttpException('Register Code Invalid', HttpStatus.FORBIDDEN);
    }
    const isUsernameRepeated = await this.teacherService.checkUsernameExist(
      username,
    );
    if (isUsernameRepeated) {
      throw new HttpException('Username Repeated', HttpStatus.FORBIDDEN);
    }
    await this.teacherService.register(username, password, name, registerCode);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ValidationPipe()) { username, password }: LoginTeacherDto,
  ) {
    const isUserNameExist = await this.teacherService.checkUsernameExist(
      username,
    );
    if (!isUserNameExist) {
      throw new HttpException('Username Not Found', HttpStatus.UNAUTHORIZED);
    }
    const isBanned = await this.teacherService.checkBan(username);
    if (isBanned) {
      throw new HttpException('Teacher Banned', HttpStatus.UNAUTHORIZED);
    }
    const isPasswordCorrect = await this.teacherService.checkPasswordHash(
      { username },
      password,
    );
    if (!isPasswordCorrect) {
      throw new HttpException('Password Incorrect', HttpStatus.UNAUTHORIZED);
    }
    const id = await this.teacherService.getId(username);
    return await this.authService.signJwtWithId(id);
  }

  @Get('init')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  @ApiOperation({ summary: 'Init with jwt header' })
  async init(@AuthUserId() userId: string) {
    return await this.teacherService.init(userId);
  }

  @Patch('name')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async modifyName(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe()) { newName }: ModifyNameDto,
  ) {
    await this.teacherService.modifyName(userId, newName);
    return DEFAULT_SUCCESS_RESPONSE;
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
    if (!isOldPasswordCorrect) {
      throw new HttpException('Old Password Incorrect', HttpStatus.FORBIDDEN);
    }
    await this.teacherService.modifyPassword(userId, newPassword);
    return DEFAULT_SUCCESS_RESPONSE;
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
    await this.teacherService.modifyStudentRemark(userId, studentId, newRemark);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Delete('student')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async deleteStudent(
    @AuthUserId() userId: string,
    @Query(new ValidationPipe())
    { studentId }: DeleteStudentDto,
  ) {
    await this.teacherService.deleteStudent(userId, studentId);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Get('messages')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  async findMessages(
    @AuthUserId() userId: string,
    @Query(new ValidationPipe()) { skip, take }: PaginationDto,
  ) {
    return await this.teacherService.findMessages(userId, +skip, +take);
  }

  @Post('message-close')
  @UseGuards(TeacherAuthGuard)
  @ApiBearerAuth('teacher')
  @ApiOperation({ summary: 'Teacher force close message for student' })
  async closeMessage(
    @Body(new ValidationPipe())
    { messageId, studentId }: CloseMessageByTeacherDto,
  ) {
    this.teacherService.closeMessage(messageId, studentId);
    return DEFAULT_SUCCESS_RESPONSE;
  }
}

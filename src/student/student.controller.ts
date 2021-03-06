import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { StudentAuthGuard } from '~/auth/guards/student-auth.guard';
import { DEFAULT_SUCCESS_RESPONSE } from '~/common/constants';
import { AuthUserId } from '~/common/decorators/auth-user-id.decorator';
import { PaginationDto } from '~/common/dto/pagination.dto';
import { AnswerConnectRequestDto } from './dto/answer-connect-request.dto';
import { CloseMessageDto } from './dto/close-message.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { StudentService } from './student.service';

@ApiTags('student')
@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with key' })
  async login(@Body(new ValidationPipe()) { key }: StudentLoginDto) {
    const isKeyExist = await this.studentService.checkKeyExist(key);
    if (!isKeyExist) {
      throw new HttpException('Key Not Found', HttpStatus.UNAUTHORIZED);
    }
    const isBanned = await this.studentService.checkBan(key);
    if (isBanned) {
      throw new HttpException('Student Banned', HttpStatus.UNAUTHORIZED);
    }
    const id = await this.studentService.findIdByKey(key);
    return await this.authService.signJwtWithId(id);
  }

  @Get('init')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  @ApiOperation({ summary: 'Init with jwt header' })
  async init(@AuthUserId() userId: string) {
    return await this.studentService.init(userId);
  }

  @Get('connect-code')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  findConnectCode(@AuthUserId() userId: string) {
    try {
      return this.studentService.findConnectCode(userId);
    } catch (error) {
      throw new HttpException('Connect Code Not Found', HttpStatus.NOT_FOUND);
    }
  }

  @Post('connect-request-rejection')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  rejectConnectRequest(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe()) { requestId }: AnswerConnectRequestDto,
  ) {
    const isAllowAnswerRequest =
      this.studentService.checkConnectRequestPermission(userId, requestId);
    if (!isAllowAnswerRequest) {
      throw new HttpException('Request Not Found', HttpStatus.NOT_FOUND);
    }
    this.studentService.rejectTeacherConnectRequest(requestId);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Post('connect-request-acceptance')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  async acceptConnectRequest(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe()) { requestId }: AnswerConnectRequestDto,
  ) {
    const isAllowAnswerRequest =
      this.studentService.checkConnectRequestPermission(userId, requestId);
    if (!isAllowAnswerRequest) {
      throw new HttpException('Request Not Found', HttpStatus.NOT_FOUND);
    }
    return await this.studentService.acceptTeacherConnectRequest(requestId);
  }

  @Get('teachers')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  async findTeachers(@AuthUserId() userId: string) {
    return await this.studentService.findTeachers(userId);
  }

  @Post('message-close')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  closeMessage(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe()) { messageId }: CloseMessageDto,
  ) {
    const isAllowCloseMessage = this.studentService.checkCloseMessagePermission(
      userId,
      messageId,
    );
    if (!isAllowCloseMessage) {
      throw new HttpException('Message Id Not Found', HttpStatus.NOT_FOUND);
    }
    this.studentService.closeMessage(userId, messageId);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Get('messages')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  async findMessages(
    @AuthUserId() userId: string,
    @Query(new ValidationPipe())
    { skip, take }: PaginationDto,
  ) {
    return await this.studentService.findMessages(userId, +skip, +take);
  }

  @Get('teacher-url')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  getTeacherURL() {
    const envURL = this.configService.get<string>('TEACHER_URL');
    const url = new URL(envURL).toString();
    return { url };
  }
}

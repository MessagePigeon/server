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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { StudentAuthGuard } from '~/auth/guards/student-auth.guard';
import { AuthUserId } from '~/common/decorators/auth-user-id.decorator';
import { AnswerConnectRequestDto } from './dto/answer-connect-request.dto';
import { CloseMessageDto } from './dto/close-message.dto';
import { FindMessagesDto } from './dto/find-messages.dto';
import { StudentLoginDto } from './dto/student-login.dto';
import { StudentService } from './student.service';

@ApiTags('student')
@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with key' })
  async login(@Body(new ValidationPipe()) { key }: StudentLoginDto) {
    const isKeyExist = await this.studentService.checkKeyExist(key);
    if (isKeyExist) {
      const id = await this.studentService.findIdByKey(key);
      return await this.authService.signJwtWithId(id);
    } else {
      throw new HttpException('Key Not Found', HttpStatus.UNAUTHORIZED);
    }
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
  async rejectConnectRequest(
    @AuthUserId() userId: string,
    @Body(new ValidationPipe()) { requestId }: AnswerConnectRequestDto,
  ) {
    const isAllowAnswerRequest =
      this.studentService.checkConnectRequestPermission(userId, requestId);
    if (!isAllowAnswerRequest) {
      throw new HttpException('Request Not Found', HttpStatus.NOT_FOUND);
    }
    this.studentService.rejectTeacherConnectRequest(requestId);
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
    console.log(isAllowAnswerRequest);
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
    if (isAllowCloseMessage) {
      return this.studentService.closeMessage(userId, messageId);
    } else {
      throw new HttpException('Message Id Not Found', HttpStatus.NOT_FOUND);
    }
  }

  @Get('messages')
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth('student')
  async findMessages(
    @AuthUserId() userId: string,
    @Query(new ValidationPipe())
    { skip, take, teacherId, content }: FindMessagesDto,
  ) {
    return await this.studentService.findMessages(
      userId,
      +skip,
      +take,
      teacherId,
      content,
    );
  }
}

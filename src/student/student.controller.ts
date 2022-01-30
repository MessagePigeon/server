import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { StudentAuthGuard } from '~/auth/guards/student-auth.guard';
import { AuthUserId } from '~/common/decorators/auth-user-id.decorator';
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
}

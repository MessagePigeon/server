import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { AdminAuthGuard } from '~/auth/guards/admin-auth.guard';
import { PaginationDto } from '~/common/dto/pagination.dto';
import { generateRandomString } from '~/common/utils/generate-random-string.util';
import { StudentService } from '~/student/student.service';
import { TeacherService } from '~/teacher/teacher.service';
import { AdminService } from './admin.service';
import { FindRegisterCodeDto } from './dto/find-register-codes.dto';
import { GenerateRegisterCodesDto } from './dto/generate-register-codes.dto';
import { GenerateStudentDto } from './dto/generate-student.dto';
import { GenerateTeacherDto } from './dto/generate-teacher.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ModifyStudentDto } from './dto/modify-student.dto';
import { ModifyTeacherRealNameDto } from './dto/modify-teacher-real-name.dto';
import { ResetTeacherPasswordDto } from './dto/reset-teacher-password.dto';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly teacherService: TeacherService,
    private readonly studentService: StudentService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ValidationPipe()) { password }: LoginAdminDto) {
    const isPasswordValid = this.adminService.checkPassword(password);
    if (isPasswordValid) {
      return await this.authService.signAdminJwt();
    } else {
      throw new HttpException('Password Incorrect', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('init')
  @ApiBearerAuth('admin')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Init with jwt header' })
  init() {
    return { status: true };
  }

  @Put('teacher/register-codes')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Generate teacher register codes' })
  async generateTeacherRegisterCodes(
    @Body(new ValidationPipe()) { count }: GenerateRegisterCodesDto,
  ) {
    return await this.adminService.generateTeacherRegisterCodes(count);
  }

  @Get('teacher/register-codes')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Get teacher register codes' })
  async findTeacherRegisterCodes(
    @Query(new ValidationPipe()) { skip, take, used }: FindRegisterCodeDto,
  ) {
    return await this.adminService.findTeacherRegisterCode(
      +skip,
      +take,
      (used as unknown) === undefined
        ? undefined
        : (used as unknown) === 'true',
    );
  }

  @Post('teacher')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Generate teacher with random password' })
  async generateTeacher(
    @Body(new ValidationPipe()) { username, realName }: GenerateTeacherDto,
  ) {
    const isUsernameRepeated = await this.teacherService.checkUsernameExist(
      username,
    );
    if (!isUsernameRepeated) {
      return await this.adminService.generateTeacher(username, realName);
    } else {
      throw new HttpException('Username Repeated', HttpStatus.FORBIDDEN);
    }
  }

  @Get('teachers')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async findTeachers(
    @Query(new ValidationPipe()) { skip, take }: PaginationDto,
  ) {
    return await this.adminService.findTeachers(+skip, +take);
  }

  @Patch('teacher/real-name')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async modifyTeacherRealName(
    @Body(new ValidationPipe()) { id, newRealName }: ModifyTeacherRealNameDto,
  ) {
    return await this.teacherService.modifyRealName(id, newRealName);
  }

  @Patch('teacher/password')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Reset teacher password to random string' })
  async resetTeacherPassword(
    @Body(new ValidationPipe()) { id }: ResetTeacherPasswordDto,
  ) {
    return await this.adminService.resetTeacherPassword(id);
  }

  @Post('student')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Generate student with key or random string' })
  async generateStudent(
    @Body(new ValidationPipe()) { key, defaultRemark }: GenerateStudentDto,
  ) {
    if (key === undefined) {
      key = generateRandomString(16);
    }
    const isStudentKeyRepeated = await this.studentService.checkKeyExist(key);
    if (!isStudentKeyRepeated) {
      return await this.adminService.generateStudent(key, defaultRemark);
    } else {
      throw new HttpException('Key Repeated', HttpStatus.FORBIDDEN);
    }
  }

  @Get('students')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async findStudents(
    @Query(new ValidationPipe()) { skip, take }: PaginationDto,
  ) {
    return await this.adminService.findStudents(+skip, +take);
  }

  @Patch('student')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async modifyStudent(
    @Body(new ValidationPipe()) { id, ...data }: ModifyStudentDto,
  ) {
    return await this.adminService.modifyStudent(id, data);
  }
}

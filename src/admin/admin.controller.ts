import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { PaginationDto } from '~/common/dto/pagination.dto';
import { generateRandomString } from '~/common/utils/generate-random-string.util';
import { TeacherService } from '~/teacher/teacher.service';
import { AdminAuthGuard } from '~/common/guards/admin-auth.guard';
import { AdminService } from './admin.service';
import { FindRegisterCodeDto } from './dto/find-register-codes.dto';
import { GenerateRegisterCodesDto } from './dto/generate-register-codes.dto';
import { GenerateStudentDto } from './dto/generate-student.dto';
import { GenerateTeacherDto } from './dto/generate-teacher.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ModifyTeacherRealNameDto } from './dto/modify-teacher-real-name.dto';
import { ResetTeacherPasswordDto } from './dto/reset-teacher-password.dto';
import { AdminAuthGuardRequest } from './types/admin-auth-guard-request.type';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly teacherService: TeacherService,
  ) {}

  @Post('login')
  login(@Body(new ValidationPipe()) { password }: LoginAdminDto) {
    const isPasswordValid = this.adminService.checkPassword(password);
    if (isPasswordValid) {
      return this.authService.generateAdminJwt();
    } else {
      throw new HttpException('Password Incorrect', HttpStatus.UNAUTHORIZED);
    }
  }

  @Put('register-codes')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Generate teacher register codes' })
  async generateRegisterCodes(
    @Body(new ValidationPipe()) { count }: GenerateRegisterCodesDto,
  ) {
    return await this.adminService.generateRegisterCodes(count);
  }

  @Get('register-codes')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Get teacher register codes' })
  async findRegisterCodes(
    @Query(new ValidationPipe()) { skip, take, used }: FindRegisterCodeDto,
  ) {
    return await this.adminService.findRegisterCode(
      +skip,
      +take,
      (used as unknown) === undefined
        ? undefined
        : (used as unknown) === 'true',
    );
  }

  @Get('init')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Init with jwt header' })
  init(@Req() { user }: AdminAuthGuardRequest) {
    return user;
  }

  @Post('teacher')
  @UseGuards(AdminAuthGuard)
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
  async findTeachers(
    @Query(new ValidationPipe()) { skip, take }: PaginationDto,
  ) {
    return await this.adminService.findTeachers(+skip, +take);
  }

  @Patch('teacher/real-name')
  @UseGuards(AdminAuthGuard)
  async modifyTeacherRealName(
    @Body(new ValidationPipe()) { id, newRealName }: ModifyTeacherRealNameDto,
  ) {
    return await this.teacherService.modifyRealName(id, newRealName);
  }

  @Patch('teacher/password')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Reset teacher password to random string' })
  async resetTeacherPassword(
    @Body(new ValidationPipe()) { id }: ResetTeacherPasswordDto,
  ) {
    return await this.adminService.resetTeacherPassword(id);
  }

  @Post('student')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Generate student with key or random string' })
  async generateStudent(
    @Body(new ValidationPipe()) { key, defaultRemark }: GenerateStudentDto,
  ) {
    if (key === undefined) {
      key = generateRandomString(16);
    }
    const isStudentKeyRepeated = await this.adminService.checkStudentKeyExist(
      key,
    );
    if (!isStudentKeyRepeated) {
      return await this.adminService.generateStudent(key, defaultRemark);
    } else {
      throw new HttpException('Key Repeated', HttpStatus.FORBIDDEN);
    }
  }

  @Get('students')
  @UseGuards(AdminAuthGuard)
  async findStudents(
    @Query(new ValidationPipe()) { skip, take }: PaginationDto,
  ) {
    return await this.adminService.findStudents(+skip, +take);
  }
}

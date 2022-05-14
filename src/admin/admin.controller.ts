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
import { AdminAuthGuard } from '~/auth/guards/admin-auth.guard';
import { DEFAULT_SUCCESS_RESPONSE } from '~/common/constants';
import { PaginationDto } from '~/common/dto/pagination.dto';
import { generateRandomString } from '~/common/utils/generate-random-string.util';
import { StudentService } from '~/student/student.service';
import { TeacherService } from '~/teacher/teacher.service';
import { AdminService } from './admin.service';
import { DeleteTeacherRegisterCodeDto } from './dto/delete-teacher-register-code.dto';
import { FindMessagesDto } from './dto/find-messages.dto';
import { FindStudentsDto } from './dto/find-students.dto';
import { FindTeacherDto } from './dto/find-teachers.dto';
import { GenerateRegisterCodesDto } from './dto/generate-register-codes.dto';
import { GenerateStudentDto } from './dto/generate-student.dto';
import { GenerateTeacherDto } from './dto/generate-teacher.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ModifyConnectionDto } from './dto/modify-connection.dto';
import { ModifyStudentDto } from './dto/modify-student.dto';
import { ModifyTeacherNameDto } from './dto/modify-teacher-name.dto';
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
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Post('teacher/register-codes')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Generate teacher register codes' })
  async generateTeacherRegisterCodes(
    @Body(new ValidationPipe()) { count }: GenerateRegisterCodesDto,
  ) {
    await this.adminService.generateTeacherRegisterCodes(count);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Get('teacher/register-codes')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Get teacher register codes' })
  async findTeacherRegisterCodes(
    @Query(new ValidationPipe()) { skip, take }: PaginationDto,
  ) {
    return await this.adminService.findTeacherRegisterCode(+skip, +take);
  }

  @Delete('teacher/register-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async deleteTeacherRegisterCodes(
    @Query(new ValidationPipe()) { id }: DeleteTeacherRegisterCodeDto,
  ) {
    await this.adminService.deleteTeacherRegisterCode(+id);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Post('teacher')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Generate teacher with random password' })
  async createTeacher(
    @Body(new ValidationPipe()) { username, name }: GenerateTeacherDto,
  ) {
    const isUsernameRepeated = await this.teacherService.checkUsernameExist(
      username,
    );
    if (isUsernameRepeated) {
      throw new HttpException('Username Repeated', HttpStatus.FORBIDDEN);
    }
    return await this.adminService.createTeacher(username, name);
  }

  @Get('teachers')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async findTeachers(
    @Query(new ValidationPipe())
    { skip, take, id, username, name }: FindTeacherDto,
  ) {
    return await this.adminService.findTeachers(
      +skip,
      +take,
      id,
      username,
      name,
    );
  }

  @Patch('teacher/name')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async modifyTeacherName(
    @Body(new ValidationPipe()) { id, newName }: ModifyTeacherNameDto,
  ) {
    return await this.teacherService.modifyName(id, newName);
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
  async createStudent(
    @Body(new ValidationPipe()) { key, defaultRemark }: GenerateStudentDto,
  ) {
    if (key === undefined) {
      key = generateRandomString(16);
    }
    const isStudentKeyRepeated = await this.studentService.checkKeyExist(key);
    if (isStudentKeyRepeated) {
      throw new HttpException('Key Repeated', HttpStatus.FORBIDDEN);
    }
    return await this.adminService.createStudent(key, defaultRemark);
  }

  @Get('students')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async findStudents(
    @Query(new ValidationPipe())
    { skip, take, id, defaultRemark }: FindStudentsDto,
  ) {
    return await this.adminService.findStudents(
      +skip,
      +take,
      id,
      defaultRemark,
    );
  }

  @Patch('student')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async modifyStudent(
    @Body(new ValidationPipe()) { id, ...data }: ModifyStudentDto,
  ) {
    await this.adminService.modifyStudent(id, data);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Post('connection')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async makeConnection(
    @Body(new ValidationPipe()) { studentId, teacherId }: ModifyConnectionDto,
  ) {
    const isTeacherIdExist = await this.adminService.checkTeacherId(teacherId);
    if (!isTeacherIdExist) {
      throw new HttpException('Teacher Id Not Found', HttpStatus.NOT_FOUND);
    }
    const isStudentIdExist = await this.adminService.checkStudentId(studentId);
    if (!isStudentIdExist) {
      throw new HttpException('Student Id Not Found', HttpStatus.NOT_FOUND);
    }
    const isConnected = await this.adminService.checkIsConnected(
      studentId,
      teacherId,
    );
    if (isConnected) {
      throw new HttpException('Already Connected', HttpStatus.FORBIDDEN);
    }
    await this.adminService.makeConnection(studentId, teacherId);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Post('disconnection')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async makeDisconnection(
    @Body(new ValidationPipe()) { studentId, teacherId }: ModifyConnectionDto,
  ) {
    const isTeacherIdExist = await this.adminService.checkTeacherId(teacherId);
    if (!isTeacherIdExist) {
      throw new HttpException('Teacher Id Not Found', HttpStatus.NOT_FOUND);
    }
    const isStudentIdExist = await this.adminService.checkStudentId(studentId);
    if (!isStudentIdExist) {
      throw new HttpException('Student Id Not Found', HttpStatus.NOT_FOUND);
    }
    const isConnected = await this.adminService.checkIsConnected(
      studentId,
      teacherId,
    );
    if (!isConnected) {
      throw new HttpException('Not Connected Yet', HttpStatus.FORBIDDEN);
    }
    await this.adminService.makeDisconnection(studentId, teacherId);
    return DEFAULT_SUCCESS_RESPONSE;
  }

  @Get('messages')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth('admin')
  async findMessages(
    @Query(new ValidationPipe())
    {
      skip,
      take,
      studentId,
      teacherId,
      startTime,
      endTime,
      message,
    }: FindMessagesDto,
  ) {
    return await this.adminService.findMessages(
      +skip,
      +take,
      teacherId,
      studentId,
      startTime,
      endTime,
      message,
    );
  }
}

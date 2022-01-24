import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '~/auth/auth.service';
import { AdminAuthGuard } from '~~/guards/admin-auth.guard';
import { AdminService } from './admin.service';
import { CreateRegisterCodesDto } from './dto/create-register-codes.dto';
import { FindRegisterCodeDto } from './dto/find-register-codes.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { AdminAuthGuardRequest } from './types/admin-auth-guard-request.type';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Put('register-codes')
  @ApiOperation({ summary: 'Generate teacher register codes' })
  async createRegisterCodes(
    @Body(new ValidationPipe()) { count }: CreateRegisterCodesDto,
  ) {
    return await this.adminService.createRegisterCodes(count);
  }

  @Get('register-codes')
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

  @Post('login')
  @ApiOperation({})
  login(@Body(new ValidationPipe()) { password }: LoginAdminDto) {
    const isPasswordValid = this.adminService.checkPassword(password);
    if (isPasswordValid) {
      return this.authService.generateAdminJwt();
    } else {
      throw new HttpException('Password Incorrect', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('init')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Init with jwt header' })
  init(@Req() { user }: AdminAuthGuardRequest) {
    return user;
  }
}

import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateRegisterCodesDto } from './dto/create-register-codes.dto';
import { FindRegisterCodeDto } from './dto/find-register-codes.dto';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('register-codes')
  @ApiOperation({ summary: 'Generate teacher register codes' })
  async createRegisterCodes(
    @Body(new ValidationPipe()) createRegisterCodesDto: CreateRegisterCodesDto,
  ) {
    return await this.adminService.createRegisterCodes(
      createRegisterCodesDto.count,
    );
  }

  @Get('register-codes')
  @ApiOperation({ summary: 'Get teacher register codes' })
  async findRegisterCodes(
    @Query(new ValidationPipe()) findRegisterCodesDto: FindRegisterCodeDto,
  ) {
    return await this.adminService.findRegisterCode(
      +findRegisterCodesDto.skip,
      +findRegisterCodesDto.take,
      (findRegisterCodesDto.used as unknown) === undefined
        ? undefined
        : (findRegisterCodesDto.used as unknown) === 'true',
    );
  }
}

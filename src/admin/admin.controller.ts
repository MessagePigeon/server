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
}

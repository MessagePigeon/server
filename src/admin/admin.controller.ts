import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('register-codes')
  @ApiOperation({ summary: 'Generate teacher register code' })
  @ApiQuery({ name: 'count', required: false })
  async createRegisterCodes(@Query('count') count: number) {
    return await this.adminService.createRegisterCodes(count);
  }
}

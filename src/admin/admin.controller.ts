import { Body, Controller, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateRegisterCodesDto } from './dto/create-register-codes.dto';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('register-codes')
  @ApiOperation({ summary: 'Generate teacher register codes' })
  async createRegisterCodes(
    @Body() createRegisterCodesDto: CreateRegisterCodesDto,
  ) {
    return await this.adminService.createRegisterCodes(
      createRegisterCodesDto.count,
    );
  }
}

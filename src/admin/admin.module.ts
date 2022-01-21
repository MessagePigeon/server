import { Module } from '@nestjs/common';
import { PrismaService } from '~/services/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [PrismaService, AdminService],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '~/auth/auth.module';
import { TeacherService } from '~/teacher/teacher.service';
import { PrismaService } from '~~/services/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AdminController],
  providers: [PrismaService, AdminService, TeacherService],
})
export class AdminModule {}

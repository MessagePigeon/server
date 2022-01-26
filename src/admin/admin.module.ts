import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '~/auth/auth.module';
import { TeacherService } from '~/teacher/teacher.service';
import { PrismaService } from '~/common/services/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StudentService } from '~/student/student.service';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AdminController],
  providers: [PrismaService, AdminService, TeacherService, StudentService],
})
export class AdminModule {}

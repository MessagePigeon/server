import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '~/auth/auth.module';
import { PrismaService } from '~/common/services/prisma.service';
import { StateService } from '~/common/services/state.service';
import { StudentModule } from '~/student/student.module';
import { TeacherModule } from '~/teacher/teacher.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ConfigModule, AuthModule, TeacherModule, StudentModule],
  controllers: [AdminController],
  providers: [PrismaService, AdminService, StateService],
})
export class AdminModule {}

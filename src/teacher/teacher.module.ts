import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { PrismaService } from '~/common/services/prisma.service';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  controllers: [TeacherController],
  providers: [PrismaService, TeacherService],
  imports: [AuthModule],
})
export class TeacherModule {}

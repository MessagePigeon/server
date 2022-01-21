import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  controllers: [TeacherController],
  providers: [PrismaService, TeacherService],
})
export class TeacherModule {}

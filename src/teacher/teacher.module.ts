import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { PrismaService } from '~/common/services/prisma.service';
import { StateService } from '~/common/services/state.service';
import { TeacherWsService } from './teacher-ws.service';
import { TeacherController } from './teacher.controller';
import { TeacherGateway } from './teacher.gateway';
import { TeacherService } from './teacher.service';

@Module({
  imports: [AuthModule],
  exports: [TeacherService],
  controllers: [TeacherController],
  providers: [
    PrismaService,
    StateService,
    TeacherService,
    TeacherGateway,
    TeacherWsService,
  ],
})
export class TeacherModule {}

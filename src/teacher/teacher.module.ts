import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { PrismaService } from '~/common/services/prisma.service';
import { StateModule } from '~/state/state.module';
import { TeacherWsService } from './teacher-ws.service';
import { TeacherController } from './teacher.controller';
import { TeacherGateway } from './teacher.gateway';
import { TeacherService } from './teacher.service';

@Module({
  imports: [AuthModule, StateModule],
  exports: [TeacherService],
  controllers: [TeacherController],
  providers: [PrismaService, TeacherService, TeacherGateway, TeacherWsService],
})
export class TeacherModule {}

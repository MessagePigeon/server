import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { PrismaModule } from '~/prisma/prisma.module';
import { StateModule } from '~/state/state.module';
import { TeacherWsService } from './teacher-ws.service';
import { TeacherController } from './teacher.controller';
import { TeacherGateway } from './teacher.gateway';
import { TeacherService } from './teacher.service';

@Module({
  imports: [AuthModule, StateModule, PrismaModule],
  exports: [TeacherService],
  controllers: [TeacherController],
  providers: [TeacherService, TeacherGateway, TeacherWsService],
})
export class TeacherModule {}

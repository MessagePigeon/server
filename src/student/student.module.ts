import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { PrismaService } from '~/common/services/prisma.service';
import { StateModule } from '~/state/state.module';
import { StudentWsService } from './student-ws.service';
import { StudentController } from './student.controller';
import { StudentGateway } from './student.gateway';
import { StudentService } from './student.service';

@Module({
  imports: [AuthModule, StateModule],
  exports: [StudentService],
  controllers: [StudentController],
  providers: [PrismaService, StudentService, StudentGateway, StudentWsService],
})
export class StudentModule {}

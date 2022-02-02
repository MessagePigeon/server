import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { PrismaModule } from '~/prisma/prisma.module';
import { StateModule } from '~/state/state.module';
import { StudentWsService } from './student-ws.service';
import { StudentController } from './student.controller';
import { StudentGateway } from './student.gateway';
import { StudentService } from './student.service';

@Module({
  imports: [AuthModule, StateModule, PrismaModule],
  exports: [StudentService],
  controllers: [StudentController],
  providers: [StudentService, StudentGateway, StudentWsService],
})
export class StudentModule {}

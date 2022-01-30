import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { PrismaService } from '~/common/services/prisma.service';
import { StateService } from '~/common/services/state.service';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  imports: [AuthModule],
  controllers: [StudentController],
  providers: [StudentService, PrismaService, StateService],
  exports: [StudentService],
})
export class StudentModule {}

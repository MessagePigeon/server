import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '~/auth/auth.module';
import { PrismaModule } from '~/prisma/prisma.module';
import { StateModule } from '~/state/state.module';
import { StudentModule } from '~/student/student.module';
import { TeacherModule } from '~/teacher/teacher.module';
import { WebsocketModule } from '~/websocket/websocket.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TeacherModule,
    StudentModule,
    StateModule,
    PrismaModule,
    WebsocketModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

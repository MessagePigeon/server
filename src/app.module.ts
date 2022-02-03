import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { StateModule } from './state/state.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AdminModule,
    TeacherModule,
    StudentModule,
    StateModule,
    PrismaModule,
    WebsocketModule,
  ],
})
export class AppModule {}

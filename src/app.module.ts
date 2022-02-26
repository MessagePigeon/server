import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { StateModule } from './state/state.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { WebsocketModule } from './websocket/websocket.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AdminModule,
    TeacherModule,
    StudentModule,
    StateModule,
    PrismaModule,
    WebsocketModule,
    ScheduleModule.forRoot(),
    TasksModule,
  ],
})
export class AppModule {}

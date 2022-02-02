import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { StateModule } from './state/state.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AdminModule,
    TeacherModule,
    StudentModule,
    StateModule,
  ],
})
export class AppModule {}

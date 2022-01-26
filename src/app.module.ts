import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';
import { ConfigModule } from '@nestjs/config';
import { StudentModule } from './student/student.module';

@Module({
  imports: [ConfigModule.forRoot(), AdminModule, TeacherModule, StudentModule],
})
export class AppModule {}

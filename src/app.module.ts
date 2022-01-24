import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), AdminModule, TeacherModule],
})
export class AppModule {}

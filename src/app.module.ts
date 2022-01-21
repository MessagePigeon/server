import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';

@Module({
  imports: [AdminModule, TeacherModule],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { StateModule } from '~/state/state.module';
import { TaskService } from './task.service';

@Module({
  imports: [StateModule],
  providers: [TaskService],
})
export class TaskModule {}

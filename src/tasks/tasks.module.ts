import { Module } from '@nestjs/common';
import { StateModule } from '~/state/state.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [StateModule],
  providers: [TasksService],
})
export class TasksModule {}

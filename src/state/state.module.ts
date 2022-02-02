import { Module } from '@nestjs/common';
import { StateService } from './state.service';

@Module({
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}

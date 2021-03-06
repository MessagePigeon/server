import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '~/auth/auth.module';
import { PrismaModule } from '~/prisma/prisma.module';
import { StateModule } from '~/state/state.module';
import { WebsocketModule } from '~/websocket/websocket.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  imports: [
    AuthModule,
    StateModule,
    PrismaModule,
    forwardRef(() => WebsocketModule),
    ConfigModule,
  ],
  exports: [StudentService],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}

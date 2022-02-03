import { Module } from '@nestjs/common';
import { AuthModule } from '~/auth/auth.module';
import { PrismaModule } from '~/prisma/prisma.module';
import { StateModule } from '~/state/state.module';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';

@Module({
  imports: [StateModule, AuthModule, PrismaModule],
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketService],
})
export class WebsocketModule {}

import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { WebSocketAuthGuard } from '~/auth/guards/websocket-auth.guard';
import { AuthUserId } from '~/common/decorators/auth-user-id.decorator';
import { WsUserRole } from '~/common/decorators/ws-user-role.decorator';
import { WebsocketService } from './websocket.service';

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayDisconnect {
  constructor(private readonly websocketService: WebsocketService) {}

  @SubscribeMessage('online')
  @UseGuards(WebSocketAuthGuard)
  handleOnline(
    @ConnectedSocket() client: WebSocket,
    @AuthUserId('ws') userId: string,
    @WsUserRole() role: 'student' | 'teacher',
  ) {
    this.websocketService.clientOnline(role, userId, client);
    if (role === 'student') {
      this.websocketService.studentOnline(userId, client);
    } else {
      this.websocketService.teacherOnline(userId, client);
    }
  }

  handleDisconnect(client: any) {
    this.websocketService.clientOffline(client);
  }
}

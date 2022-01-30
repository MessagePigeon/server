import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { StudentWsAuthGuard } from '~/auth/guards/student-ws-auth.guard';
import { AuthUserId } from '~/common/decorators/auth-user-id.decorator';
import { StudentWsService } from './student-ws.service';

@WebSocketGateway()
export class StudentGateway {
  constructor(private readonly studentWsService: StudentWsService) {}

  @SubscribeMessage('student:online')
  @UseGuards(StudentWsAuthGuard)
  onOnline(
    @AuthUserId('ws') userId: string,
    @ConnectedSocket() client: WebSocket,
  ) {
    this.studentWsService.online(userId, client);
  }

  @SubscribeMessage('student:offline')
  @UseGuards(StudentWsAuthGuard)
  onOffline(@AuthUserId('ws') userId: string) {
    this.studentWsService.offline(userId);
  }
}

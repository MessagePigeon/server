import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { TeacherWsAuthGuard } from '~/auth/guards/teacher-ws-auth.guard';
import { AuthUserId } from '~/common/decorators/auth-user-id.decorator';
import { TeacherWsService } from './teacher-ws.service';

@WebSocketGateway()
export class TeacherGateway {
  constructor(private readonly teacherWsService: TeacherWsService) {}

  @SubscribeMessage('teacher:online')
  @UseGuards(TeacherWsAuthGuard)
  onOnline(
    @AuthUserId('ws') userId: string,
    @ConnectedSocket() client: WebSocket,
  ) {
    this.teacherWsService.online(userId, client);
  }

  @SubscribeMessage('teacher:offline')
  @UseGuards(TeacherWsAuthGuard)
  onOffline(@AuthUserId('ws') userId: string) {
    this.teacherWsService.offline(userId);
  }

  @SubscribeMessage('teacher:connectStudent')
  @UseGuards(TeacherWsAuthGuard)
  onConnectStudent(
    @AuthUserId('ws') userId: string,
    @MessageBody()
    { connectCode, remark }: { connectCode: string; remark: string },
  ) {
    const student = this.teacherWsService.findStudentByConnectCode(connectCode);
    if (student) {
      this.teacherWsService.connectStudent(userId, student, remark);
    }
  }
}

import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';
import { StateService } from '~/state/state.service';
import { generateRandomString } from '~/common/utils/generate-random-string.util';
import { PrismaService } from '~/prisma/prisma.service';
import { socketSend } from '~/common/utils/socket-send.util';

@Injectable()
export class StudentWsService {
  constructor(
    private readonly state: StateService,
    private readonly db: PrismaService,
  ) {}

  online(id: string, client: WebSocket) {
    const isIdExist = this.state.onlineStudents.some(
      ({ id: originId }) => originId === id,
    );
    if (!isIdExist) {
      this.state.onlineStudents.push({
        id,
        client,
        connectCode: generateRandomString(6),
      });
    }
  }

  offline(id: string) {
    const index = this.state.onlineStudents.findIndex(
      ({ id: originId }) => originId === id,
    );
    this.state.onlineStudents.splice(index, 1);
  }

  getAllOnline() {
    return this.state.onlineStudents.map(({ id }) => id);
  }

  checkConnectRequestPermission(studentId: string, requestId: string) {
    const connectRequest = this.state.connectRequests.find(
      ({ id }) => id === requestId,
    );
    return connectRequest.studentId === studentId;
  }

  rejectTeacherConnectRequest(requestId: string) {
    const index = this.state.connectRequests.findIndex(
      ({ id }) => id === requestId,
    );
    this.state.connectRequests.splice(index, 1);
  }

  async acceptTeacherConnectRequest(requestId: string) {
    const { studentId, teacherId, studentRemark } =
      this.state.connectRequests.find(({ id }) => id === requestId);
    await this.db.teacher.update({
      where: { id: teacherId },
      data: { students: { connect: { id: studentId } } },
    });
    await this.db.studentRemark.create({
      data: {
        content: studentRemark,
        teacher: { connect: { id: teacherId } },
        student: { connect: { id: studentId } },
      },
    });
    const { client: teacherClient } = this.state.onlineTeachers.find(
      ({ id }) => id === teacherId,
    );
    socketSend(teacherClient, 'teacher:studentAcceptConnect', {
      id: studentId,
    });
  }
}

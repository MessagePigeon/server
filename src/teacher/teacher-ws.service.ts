import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import * as WebSocket from 'ws';
import { PrismaService } from '~/prisma/prisma.service';
import { onlineStudent, StateService } from '~/state/state.service';
import { socketSend } from '~/common/utils/socket-send.util';

@Injectable()
export class TeacherWsService {
  constructor(
    private readonly db: PrismaService,
    private readonly state: StateService,
  ) {}

  online(id: string, client: WebSocket) {
    const isIdExist = this.state.onlineTeachers.some(
      ({ id: originId }) => originId === id,
    );
    if (!isIdExist) {
      this.state.onlineTeachers.push({ id, client });
    }
  }

  offline(id: string) {
    const index = this.state.onlineTeachers.findIndex(
      ({ id: originId }) => originId === id,
    );
    this.state.onlineTeachers.splice(index, 1);
  }

  getAllOnline() {
    return this.state.onlineTeachers.map(({ id }) => id);
  }

  findStudentByConnectCode(connectCode: string) {
    return this.state.onlineStudents.find(
      ({ connectCode: originConnectCode }) => originConnectCode === connectCode,
    );
  }

  async connectStudent(
    teacherId: string,
    student: onlineStudent,
    studentRemark: string,
  ) {
    const requestId = nanoid();
    this.state.connectRequests.push({
      id: requestId,
      teacherId,
      studentId: student.id,
      studentRemark,
    });
    const { realName: teacherName } = await this.db.teacher.findUnique({
      where: { id: teacherId },
      select: { realName: true },
    });
    socketSend(student.client, 'student:teacherConnect', {
      requestId,
      teacherName,
    });
  }
}

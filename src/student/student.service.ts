import { Injectable } from '@nestjs/common';
import { deleteArrayElementById } from '~/common/utils/delete-array-element-by-id.util';
import { findArrayElementById } from '~/common/utils/find-array-element-by-id.util';
import { PrismaService } from '~/prisma/prisma.service';
import { StateService } from '~/state/state.service';
import { WebsocketService } from '~/websocket/websocket.service';

@Injectable()
export class StudentService {
  constructor(
    private readonly db: PrismaService,
    private readonly state: StateService,
    private readonly websocketService: WebsocketService,
  ) {}

  async checkKeyExist(key: string) {
    const isKeyExistData = await this.db.student.findUnique({ where: { key } });
    const isKeyExist = isKeyExistData !== null;
    return isKeyExist;
  }

  async findIdByKey(key: string) {
    const { id } = await this.db.student.findUnique({
      where: { key },
      select: { id: true },
    });
    return id;
  }

  async init(id: string) {
    const { key, ...info } = await this.db.student.findUnique({
      where: { id },
    });
    return info;
  }

  findConnectCode(id: string) {
    const { connectCode } = findArrayElementById(this.state.onlineStudents, id);
    return { connectCode };
  }

  checkConnectRequestPermission(studentId: string, requestId: string) {
    const connectRequest = findArrayElementById(
      this.state.connectRequests,
      requestId,
    );
    return connectRequest.studentId === studentId;
  }

  rejectTeacherConnectRequest(requestId: string) {
    deleteArrayElementById(this.state.connectRequests, requestId);
    const { studentId, teacherId } = findArrayElementById(
      this.state.connectRequests,
      requestId,
    );
    this.websocketService.socketSend(
      'teacher',
      teacherId,
      'reject-connect-request',
      { studentId },
    );
  }

  async acceptTeacherConnectRequest(requestId: string) {
    const { studentId, teacherId, studentRemark } = findArrayElementById(
      this.state.connectRequests,
      requestId,
    );
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
    this.websocketService.socketSend(
      'teacher',
      teacherId,
      'accept-connect-request',
      { studentId },
    );
  }
}

import { Injectable } from '@nestjs/common';
import { checkSetsEquality } from '~/common/utils/check-sets-equality.util';
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
    const { studentId, teacherId, remark } = findArrayElementById(
      this.state.connectRequests,
      requestId,
    );
    const { realName: teacherName } = await this.db.teacher.update({
      where: { id: teacherId },
      data: { students: { connect: { id: studentId } } },
      select: { realName: true },
    });
    await this.db.studentRemark.create({
      data: {
        remark,
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
    return { teacherId, teacherName };
  }

  async findTeachers(id: string) {
    const { teachers: data } = await this.db.student.findUnique({
      where: { id },
      select: { teachers: { select: { id: true, realName: true } } },
    });
    return data.map(({ id, realName }) => ({ id, name: realName }));
  }

  checkCloseMessagePermission(studentId: string, messageId: number) {
    const message = findArrayElementById(this.state.showingMessages, messageId);
    if (message) {
      return (
        message.studentIds.has(studentId) &&
        !message.closedStudentIds.has(studentId)
      );
    } else {
      return false;
    }
  }

  closeMessage(studentId: string, messageId: number) {
    const { teacherId, studentIds, closedStudentIds } = findArrayElementById(
      this.state.showingMessages,
      messageId,
    );
    closedStudentIds.add(studentId);
    const isAllStudentsClose = checkSetsEquality(studentIds, closedStudentIds);
    if (isAllStudentsClose) {
      deleteArrayElementById(this.state.showingMessages, messageId);
    }
    this.websocketService.socketSend('teacher', teacherId, 'message-close', {
      studentId,
    });
  }

  async findMessages(id: string, skip: number, take: number) {
    const dbData = await this.db.message.findMany({
      where: { students: { some: { id } } },
      select: {
        id: true,
        createdAt: true,
        message: true,
        teacher: { select: { realName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    const data = dbData.map(({ teacher: { realName }, ...data }) => ({
      ...data,
      teacherName: realName,
    }));
    const total = await this.db.message.count({
      where: { students: { some: { id } } },
    });
    return { data, total };
  }
}

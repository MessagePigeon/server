import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    @Inject(forwardRef(() => WebsocketService))
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
    try {
      const connectRequest = findArrayElementById(
        this.state.connectRequests,
        requestId,
      );
      return connectRequest.studentId === studentId;
    } catch (error) {
      return false;
    }
  }

  rejectTeacherConnectRequest(requestId: string) {
    const { teacherId } = findArrayElementById(
      this.state.connectRequests,
      requestId,
    );
    deleteArrayElementById(this.state.connectRequests, requestId);
    this.websocketService.socketSend(
      'teacher',
      teacherId,
      'reject-connect-request',
      { requestId },
    );
  }

  async acceptTeacherConnectRequest(requestId: string) {
    const { studentId, teacherId, remark } = findArrayElementById(
      this.state.connectRequests,
      requestId,
    );
    const { name: teacherName } = await this.db.teacher.update({
      where: { id: teacherId },
      data: { students: { connect: { id: studentId } } },
      select: { name: true },
    });
    await this.db.studentRemark.create({
      data: {
        remark,
        teacher: { connect: { id: teacherId } },
        student: { connect: { id: studentId } },
      },
    });
    deleteArrayElementById(this.state.connectRequests, requestId);
    this.websocketService.socketSend(
      'teacher',
      teacherId,
      'accept-connect-request',
      { requestId },
    );
    return { teacherId, teacherName };
  }

  async findTeachers(id: string) {
    const { teachers: data } = await this.db.student.findUnique({
      where: { id },
      select: { teachers: { select: { id: true, name: true } } },
    });
    return data.map(({ id, name }) => ({ id, name: name }));
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
      messageId,
      studentId,
    });
  }

  async findMessages(
    id: string,
    skip: number,
    take: number,
    teacherId?: string,
    content?: string,
  ) {
    const where: Prisma.MessageWhereInput = {
      students: { some: { id } },
      teacher: { id: teacherId },
      message: { contains: content },
    };
    const dbData = await this.db.message.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        message: true,
        teacher: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    const data = dbData.map(({ teacher: { name }, ...data }) => ({
      ...data,
      teacherName: name,
    }));
    const total = await this.db.message.count({ where });
    return { data, total };
  }
}

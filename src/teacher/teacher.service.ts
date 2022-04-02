import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { checkSetsEquality } from '~/common/utils/check-sets-equality.util';
import { deleteArrayElementById } from '~/common/utils/delete-array-element-by-id.util';
import { findArrayElementById } from '~/common/utils/find-array-element-by-id.util';
import {
  signHashPassword,
  verifyHashPassword,
} from '~/common/utils/hash-password.util';
import { PrismaService } from '~/prisma/prisma.service';
import { onlineStudent, StateService } from '~/state/state.service';
import { WebsocketService } from '~/websocket/websocket.service';

@Injectable()
export class TeacherService {
  constructor(
    private readonly db: PrismaService,
    private readonly state: StateService,
    private readonly websocketService: WebsocketService,
  ) {}

  async checkUsernameExist(username: string) {
    const isUsernameExistData = await this.db.teacher.findUnique({
      where: { username },
    });
    const isUsernameExist = isUsernameExistData !== null;
    return isUsernameExist;
  }

  async checkRegisterCodeInvalid(code: string) {
    const count = await this.db.registerCode.count({ where: { code } });
    return count === 0;
  }

  async register(
    username: string,
    password: string,
    name: string,
    registerCode: string,
  ) {
    await this.db.registerCode.delete({ where: { code: registerCode } });
    await this.db.teacher.create({
      data: {
        username,
        password: await signHashPassword(password),
        name,
      },
      select: { username: true, name: true },
    });
  }

  async checkPasswordHash(
    uniqueField: { username: string } | { id: string },
    password: string,
  ) {
    const { password: passwordHash } = await this.db.teacher.findUnique({
      where: uniqueField,
    });
    return await verifyHashPassword(passwordHash, password);
  }

  async getId(username: string) {
    const { id } = await this.db.teacher.findUnique({ where: { username } });
    return id;
  }

  async init(id: string) {
    const { name } = await this.db.teacher.findUnique({
      where: { id },
    });
    return { name };
  }

  async modifyName(id: string, newName: string) {
    const { students } = await this.db.teacher.findUnique({
      where: { id },
      select: { students: { select: { id: true } } },
    });
    students.forEach(({ id: studentId }) => {
      this.websocketService.socketSend(
        'student',
        studentId,
        'teacher-name-changed',
        {
          teacherId: id,
          newName,
        },
      );
    });
    await this.db.teacher.update({
      where: { id },
      data: { name: newName },
    });
  }

  async modifyPassword(id: string, newPassword: string) {
    await this.db.teacher.update({
      where: { id },
      data: { password: await signHashPassword(newPassword) },
    });
  }

  findStudentByConnectCode(connectCode: string) {
    return this.state.onlineStudents.find(
      ({ connectCode: originConnectCode }) => originConnectCode === connectCode,
    );
  }

  async checkStudentAlreadyConnected(teacherId: string, studentId: string) {
    const { students } = await this.db.teacher.findUnique({
      where: { id: teacherId },
      select: { students: { select: { id: true } } },
    });
    return students.map(({ id }) => id).includes(studentId);
  }

  async connectStudent(
    teacherId: string,
    student: onlineStudent,
    remark: string,
  ) {
    const requestId = nanoid();
    this.state.connectRequests.push({
      id: requestId,
      teacherId,
      studentId: student.id,
      remark,
      createdAt: new Date(),
    });
    const { name: teacherName } = await this.db.teacher.findUnique({
      where: { id: teacherId },
      select: { name: true },
    });
    this.websocketService.socketSend('student', student.id, 'connect-request', {
      requestId,
      teacherName,
    });
    return { requestId, studentId: student.id, remark };
  }

  async findStudents(id: string) {
    const dbData = await this.db.studentRemark.findMany({
      where: { teacherId: id },
      orderBy: { createdAt: 'desc' },
      select: { studentId: true, remark: true },
    });
    return dbData.map(({ studentId, ...data }) => ({
      online: this.state.onlineStudents.some(({ id }) => id === studentId),
      id: studentId,
      ...data,
    }));
  }

  async sendMessage(
    teacherId: string,
    studentIds: string[],
    message: string,
    tts: number,
    closeDelay: number,
  ) {
    const {
      id: messageId,
      createdAt,
      teacher: { name: teacherName },
    } = await this.db.message.create({
      data: {
        message,
        teacher: { connect: { id: teacherId } },
        students: { connect: studentIds.map((id) => ({ id })) },
      },
      select: {
        id: true,
        createdAt: true,
        teacher: { select: { name: true } },
      },
    });
    this.state.showingMessages.push({
      id: messageId,
      teacherId,
      studentIds: new Set(studentIds),
      closedStudentIds: new Set(),
      createdAt,
    });
    studentIds.forEach((id) => {
      this.websocketService.socketSend('student', id, 'message', {
        messageId,
        createdAt,
        message,
        teacherName,
        tts,
        closeDelay,
      });
    });
    return { messageId, createdAt, message, studentIds };
  }

  async modifyStudentRemark(
    teacherId: string,
    studentId: string,
    remark: string,
  ) {
    await this.db.studentRemark.update({
      where: { teacherId_studentId: { teacherId, studentId } },
      data: { remark },
    });
  }

  async deleteStudent(teacherId: string, studentId: string) {
    await this.db.studentRemark.delete({
      where: { teacherId_studentId: { teacherId, studentId } },
    });
    await this.db.teacher.update({
      where: { id: teacherId },
      data: { students: { disconnect: { id: studentId } } },
    });
    this.websocketService.socketSend(
      'student',
      studentId,
      'teacher-disconnect',
      { teacherId },
    );
  }

  async findMessages(teacherId: string, skip: number, take: number) {
    const total = await this.db.message.count({
      where: { teacher: { id: teacherId } },
    });

    const dbOriginData = await this.db.message.findMany({
      where: { teacher: { id: teacherId } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        message: true,
        students: { select: { id: true } },
      },
      skip,
      take,
    });

    const dbData = dbOriginData.map(({ students, ...data }) => ({
      ...data,
      studentIds: students.map(({ id }) => id),
    }));

    const data = dbData.map(({ id, ...data }) => {
      const showingIds: string[] = [];
      const messageState = findArrayElementById(this.state.showingMessages, id);
      if (messageState) {
        const { studentIds, closedStudentIds } = messageState;
        studentIds.forEach((id) => {
          if (!closedStudentIds.has(id)) {
            showingIds.push(id);
          }
        });
      }
      return { id, ...data, showingIds };
    });

    return { data, total };
  }

  closeMessage(messageId: number, studentId: string) {
    const { studentIds, closedStudentIds } = findArrayElementById(
      this.state.showingMessages,
      messageId,
    );
    closedStudentIds.add(studentId);
    const isAllStudentsClose = checkSetsEquality(studentIds, closedStudentIds);
    if (isAllStudentsClose) {
      deleteArrayElementById(this.state.showingMessages, messageId);
    }
    this.websocketService.socketSend('student', studentId, 'close-message', {
      messageId,
    });
  }
}

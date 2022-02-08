import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
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

  async checkRegisterCodeValid(registerCode: string) {
    const isRegisterCodeValidData = await this.db.registerCode.findFirst({
      where: { code: registerCode },
      select: { used: true },
    });
    const isRegisterCodeStatusValid = isRegisterCodeValidData
      ? !isRegisterCodeValidData.used
      : false;
    return isRegisterCodeStatusValid;
  }

  async checkUsernameExist(username: string) {
    const isUsernameExistData = await this.db.teacher.findUnique({
      where: { username },
    });
    const isUsernameExist = isUsernameExistData !== null;
    return isUsernameExist;
  }

  async updateRegisterCode(registerCode: string) {
    return await this.db.registerCode.update({
      where: { code: registerCode },
      data: { used: true },
    });
  }

  async create(username: string, password: string, name: string) {
    return await this.db.teacher.create({
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
    const { password, ...info } = await this.db.teacher.findUnique({
      where: { id },
    });
    return info;
  }

  async modifyName(id: string, newName: string) {
    return await this.db.teacher.update({
      where: { id },
      data: { name: newName },
      select: { username: true, name: true },
    });
  }

  async modifyPassword(id: string, newPassword: string) {
    const { username } = await this.db.teacher.update({
      where: { id },
      data: { password: await signHashPassword(newPassword) },
      select: { username: true },
    });
    return { username, password: newPassword };
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
    });
    const { name: teacherName } = await this.db.teacher.findUnique({
      where: { id: teacherId },
      select: { name: true },
    });
    this.websocketService.socketSend('student', student.id, 'connect-request', {
      requestId,
      teacherName,
    });
    return { studentId: student.id, requestId, remark };
  }

  async findStudents(id: string) {
    const dbData = await this.db.studentRemark.findMany({
      where: { teacherId: id },
      orderBy: { createdAt: 'desc' },
      select: { studentId: true, remark: true },
    });
    return dbData.map((data) => ({
      online: this.state.onlineStudents.some(({ id }) => id === data.studentId),
      ...data,
    }));
  }

  async sendMessage(
    teacherId: string,
    studentIds: string[],
    message: string,
    tts: boolean,
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
    return { studentId, remark };
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
}

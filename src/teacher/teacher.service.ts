import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
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

  async create(username: string, password: string, realName: string) {
    return await this.db.teacher.create({
      data: {
        username,
        password: await signHashPassword(password),
        realName,
      },
      select: { username: true, realName: true },
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

  async modifyRealName(id: string, newRealName: string) {
    return await this.db.teacher.update({
      where: { id },
      data: { realName: newRealName },
      select: { username: true, realName: true },
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
    this.websocketService.socketSend('student', student.id, 'connect-request', {
      requestId,
      teacherName,
    });
    return { studentId: student.id, requestId };
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
      teacher: { realName: teacherName },
    } = await this.db.message.create({
      data: {
        message,
        teacher: { connect: { id: teacherId } },
        students: { connect: studentIds.map((id) => ({ id })) },
      },
      select: { id: true, teacher: { select: { realName: true } } },
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
        message,
        teacherName,
        tts,
        closeDelay,
      });
    });
  }
}

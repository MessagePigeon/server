import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { generateRandomString } from '~/common/utils/generate-random-string.util';
import { signHashPassword } from '~/common/utils/hash-password.util';
import { PrismaService } from '~/prisma/prisma.service';
import { StateService } from '~/state/state.service';
import { WebsocketService } from '~/websocket/websocket.service';
import { ModifyStudentDto } from './dto/modify-student.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly db: PrismaService,
    private readonly configService: ConfigService,
    private readonly state: StateService,
    private readonly websocketService: WebsocketService,
  ) {}

  async generateTeacherRegisterCodes(count: number) {
    const codes = new Array(count)
      .fill(null)
      .map(() => ({ code: generateRandomString(32) }));
    await this.db.registerCode.createMany({
      data: codes,
    });
  }

  async findTeacherRegisterCode(skip: number, take: number) {
    const data = await this.db.registerCode.findMany({
      skip,
      take,
      orderBy: { id: 'desc' },
    });
    const total = await this.db.registerCode.count();
    return { data, total };
  }

  async deleteTeacherRegisterCode(id: number) {
    await this.db.registerCode.delete({ where: { id } });
  }

  checkPassword(password: string) {
    const isPasswordValid =
      password === this.configService.get<string>('ADMIN_PASSWORD');
    return isPasswordValid;
  }

  async createTeacher(username: string, name: string) {
    const password = generateRandomString(8);
    await this.db.teacher.create({
      data: { username, password: await signHashPassword(password), name },
    });
    return { password };
  }

  async findTeachers(
    skip: number,
    take: number,
    id?: string,
    username?: string,
    name?: string,
  ) {
    const where: Prisma.TeacherWhereInput = {
      id,
      username: { contains: username },
      name: { contains: name },
    };
    const dbData = await this.db.teacher.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        students: { select: { id: true, defaultRemark: true } },
      },
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    const onlineTeachersId = this.state.onlineTeachers.map(({ id }) => id);
    const data = dbData.map(({ id, ...data }) => ({
      id,
      ...data,
      online: onlineTeachersId.includes(id),
    }));
    const total = await this.db.teacher.count({ where });
    return { data, total };
  }

  async resetTeacherPassword(id: string) {
    const newPassword = generateRandomString(8);
    const { username } = await this.db.teacher.update({
      where: { id },
      data: { password: await signHashPassword(newPassword) },
      select: { username: true },
    });
    return { username, newPassword };
  }

  async createStudent(key: string, defaultRemark: string) {
    await this.db.student.create({
      data: { key, defaultRemark },
    });
    return { key, defaultRemark };
  }

  async findStudents(
    skip: number,
    take: number,
    id?: string,
    defaultRemark?: string,
  ) {
    const where: Prisma.StudentWhereInput = {
      id,
      defaultRemark: { contains: defaultRemark },
    };
    const dbData = await this.db.student.findMany({
      select: {
        id: true,
        key: true,
        defaultRemark: true,
        teachers: { select: { id: true, name: true } },
      },
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    const onlineStudentIds = this.state.onlineStudents.map(({ id }) => id);
    const data = dbData.map(({ id, ...data }) => ({
      id,
      ...data,
      online: onlineStudentIds.includes(id),
    }));
    const total = await this.db.student.count({ where });
    return { data, total };
  }

  async modifyStudent(id: string, data: Partial<Omit<ModifyStudentDto, 'id'>>) {
    await this.db.student.update({ where: { id }, data });
  }

  async checkIsConnected(studentId: string, teacherId: string) {
    const { students } = await this.db.teacher.findUnique({
      where: { id: teacherId },
      select: { students: { where: { id: studentId } } },
    });
    return students.length !== 0;
  }

  async checkStudentId(id: string) {
    const student = await this.db.student.findUnique({ where: { id } });
    return student !== null;
  }

  async checkTeacherId(id: string) {
    const teacher = await this.db.teacher.findUnique({ where: { id } });
    return teacher !== null;
  }

  async makeConnection(studentId: string, teacherId: string) {
    const { defaultRemark } = await this.db.student.update({
      where: { id: studentId },
      data: { teachers: { connect: { id: teacherId } } },
      select: { defaultRemark: true },
    });
    const {
      teacher: { name: teacherName },
    } = await this.db.studentRemark.create({
      data: {
        remark: defaultRemark,
        teacher: { connect: { id: teacherId } },
        student: { connect: { id: studentId } },
      },
      select: { teacher: { select: { name: true } } },
    });
    this.websocketService.socketSend(
      'student',
      studentId,
      'teacher-connect-by-admin',
      {
        teacherId,
        teacherName,
      },
    );
    const onlineStudentIds = this.state.onlineStudents.map(({ id }) => id);
    this.websocketService.socketSend(
      'teacher',
      teacherId,
      'student-connect-by-admin',
      {
        studentId,
        remark: defaultRemark,
        online: onlineStudentIds.includes(studentId),
      },
    );
  }

  async makeDisconnection(studentId: string, teacherId: string) {
    await this.db.student.update({
      where: { id: studentId },
      data: { teachers: { disconnect: { id: teacherId } } },
    });
    await this.db.studentRemark.delete({
      where: { teacherId_studentId: { teacherId, studentId } },
    });
    this.websocketService.socketSend(
      'student',
      studentId,
      'teacher-disconnect',
      { teacherId },
    );
    this.websocketService.socketSend(
      'teacher',
      teacherId,
      'student-disconnect-by-admin',
      { studentId },
    );
  }

  async findMessages(
    skip: number,
    take: number,
    teacherId?: string,
    studentId?: string,
    startTime?: string,
    endTime?: string,
    message?: string,
  ) {
    const where: Prisma.MessageWhereInput = {
      teacherId: teacherId,
      students: { some: { id: studentId } },
      createdAt: {
        gte: startTime,
        lte: endTime,
      },
      message: { contains: message },
    };
    const total = await this.db.message.count({ where });
    const data = await this.db.message.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      where,
      select: {
        id: true,
        createdAt: true,
        message: true,
        teacher: { select: { id: true, name: true } },
        students: { select: { id: true, defaultRemark: true } },
      },
    });
    return { data, total };
  }
}

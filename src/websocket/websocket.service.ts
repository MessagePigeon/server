import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';
import { deleteArrayElementById } from '~/common/utils/delete-array-element-by-id.util';
import { findArrayElementById } from '~/common/utils/find-array-element-by-id.util';
import { generateRandomString } from '~/common/utils/generate-random-string.util';
import { PrismaService } from '~/prisma/prisma.service';
import { StateService } from '~/state/state.service';
import { StudentService } from '~/student/student.service';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly state: StateService,
    private readonly db: PrismaService,
    @Inject(forwardRef(() => StudentService))
    private readonly studentService: StudentService,
  ) {}

  private checkClientOnline(id: string) {
    return this.state.onlineClients.map(({ id }) => id).includes(id);
  }

  socketSend(
    role: 'student' | 'teacher',
    id: string,
    event: string,
    data?: Record<string, any>,
  ) {
    const isClientOnline = this.checkClientOnline(id);
    if (isClientOnline) {
      const payload = JSON.stringify({ event, data });
      if (role === 'teacher') {
        const { clients } = findArrayElementById(this.state.onlineTeachers, id);
        clients.forEach((client) => client.send(payload));
      } else {
        const { client } = findArrayElementById(this.state.onlineStudents, id);
        client.send(payload);
      }
    }
  }

  private async findStudentConnectedTeachers(id: string) {
    const teachersData = await this.db.student.findUnique({
      where: { id },
      select: { teachers: { select: { id: true } } },
    });
    // teacher data may be null when deleting student
    if (teachersData) {
      return teachersData.teachers.map(({ id }) => id);
    } else {
      return null;
    }
  }

  private async studentOffline(studentId: string) {
    deleteArrayElementById(this.state.onlineStudents, studentId);
    // Close all received messages
    this.state.showingMessages
      .filter(({ studentIds }) => studentIds.has(studentId))
      .forEach((message) => {
        const isClosed = message.closedStudentIds.has(studentId);
        if (!isClosed) {
          this.studentService.closeMessage(studentId, message.id);
        }
      });
    // Notify connected teachers that this student is offline
    const connectedTeachers = await this.findStudentConnectedTeachers(
      studentId,
    );
    // teacher data may be null when deleting student
    if (connectedTeachers) {
      connectedTeachers.forEach((id) => {
        this.socketSend('teacher', id, 'student-offline', { studentId });
      });
    }
  }

  private teacherOffline(id: string, client: WebSocket) {
    const teacher = findArrayElementById(this.state.onlineTeachers, id);
    if (teacher.clients.size === 1) {
      deleteArrayElementById(this.state.onlineTeachers, id);
    } else {
      teacher.clients.delete(client);
    }
  }

  clientOnline(role: 'student' | 'teacher', id: string, client: WebSocket) {
    this.state.onlineClients.push({ id, role, client });
  }

  async clientOffline(client: WebSocket) {
    const clientData = this.state.onlineClients.find(
      ({ client: originClient }) => originClient === client,
    );
    if (clientData) {
      if (clientData.role === 'student') {
        await this.studentOffline(clientData.id);
      } else {
        this.teacherOffline(clientData.id, client);
      }
      const index = this.state.onlineClients.findIndex(
        ({ client: originClient }) => originClient === client,
      );
      this.state.onlineClients.splice(index, 1);
    }
  }

  async studentOnline(studentId: string, client: WebSocket) {
    const existentStudentData = findArrayElementById(
      this.state.onlineStudents,
      studentId,
    );
    const connectCode = generateRandomString(6);
    if (existentStudentData) {
      this.socketSend('student', studentId, 'logout');
      this.clientOffline(existentStudentData.client);
      this.state.onlineStudents.push({ id: studentId, client, connectCode });
    } else {
      this.state.onlineStudents.push({ id: studentId, client, connectCode });
    }
    const connectedTeachers = await this.findStudentConnectedTeachers(
      studentId,
    );
    connectedTeachers.forEach((id) => {
      this.socketSend('teacher', id, 'student-online', { studentId });
    });
  }

  teacherOnline(id: string, client: WebSocket) {
    const teacher = findArrayElementById(this.state.onlineTeachers, id);
    if (teacher) {
      teacher.clients.add(client);
    } else {
      this.state.onlineTeachers.push({ id, clients: new Set([client]) });
    }
  }
}

import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';

export type onlineClients = {
  id: string;
  role: 'student' | 'teacher';
  client: WebSocket;
};
export type onlineTeacher = { id: string; clients: Set<WebSocket> };
export type onlineStudent = {
  id: string;
  client: WebSocket;
  connectCode: string;
};
export type connectRequest = {
  id: string;
  teacherId: string;
  studentId: string;
  studentRemark: string;
};
export type showingMessage = {
  id: number;
  teacherId: string;
  studentIds: Set<string>;
  closedStudentIds: Set<string>;
};

@Injectable()
export class StateService {
  onlineClients: onlineClients[] = [];
  onlineTeachers: onlineTeacher[] = [];
  onlineStudents: onlineStudent[] = [];
  connectRequests: connectRequest[] = [];
  showingMessages: showingMessage[] = [];
}

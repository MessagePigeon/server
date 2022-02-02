import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';

export type onlineTeacher = { id: string; client: WebSocket };
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

@Injectable()
export class StateService {
  onlineTeachers: onlineTeacher[] = [];
  onlineStudents: onlineStudent[] = [];
  connectRequests: connectRequest[] = [];
}

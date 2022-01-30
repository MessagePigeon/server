import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';

type onlineTeacher = { id: string; client: WebSocket };
type onlineStudent = { id: string; client: WebSocket; connectCode: string };

@Injectable()
export class StateService {
  onlineTeachers: onlineTeacher[] = [];
  onlineStudents: onlineStudent[] = [];
}

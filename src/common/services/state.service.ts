import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';

type onlineTeacher = { id: string; client: WebSocket };

@Injectable()
export class StateService {
  onlineTeachers: onlineTeacher[] = [];
}

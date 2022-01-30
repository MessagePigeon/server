import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';
import { StateService } from '~/common/services/state.service';

@Injectable()
export class TeacherWsService {
  constructor(private readonly state: StateService) {}

  online(id: string, client: WebSocket) {
    const isIdExist = this.state.onlineTeachers.some(
      ({ id: originId }) => originId === id,
    );
    if (!isIdExist) {
      this.state.onlineTeachers.push({ id, client });
    }
  }

  offline(id: string) {
    const index = this.state.onlineTeachers.findIndex(
      ({ id: originId }) => originId === id,
    );
    this.state.onlineTeachers.splice(index, 1);
  }

  getAllOnline() {
    return this.state.onlineTeachers.map(({ id }) => id);
  }
}

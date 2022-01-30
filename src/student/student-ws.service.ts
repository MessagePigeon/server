import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';
import { StateService } from '~/common/services/state.service';
import { generateRandomString } from '~/common/utils/generate-random-string.util';

@Injectable()
export class StudentWsService {
  constructor(private readonly state: StateService) {}

  online(id: string, client: WebSocket) {
    const isIdExist = this.state.onlineStudents.some(
      ({ id: originId }) => originId === id,
    );
    if (!isIdExist) {
      this.state.onlineStudents.push({
        id,
        client,
        connectCode: generateRandomString(6),
      });
    }
  }

  offline(id: string) {
    const index = this.state.onlineStudents.findIndex(
      ({ id: originId }) => originId === id,
    );
    this.state.onlineStudents.splice(index, 1);
  }

  getAllOnline() {
    return this.state.onlineStudents.map(({ id }) => id);
  }
}

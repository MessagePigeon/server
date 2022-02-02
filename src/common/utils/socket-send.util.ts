import * as WebSocket from 'ws';

export function socketSend<T = Record<string, any>>(
  client: WebSocket,
  event: string,
  data: T,
) {
  const payload = { event, data };
  client.send(JSON.stringify(payload));
}

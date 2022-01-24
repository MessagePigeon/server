import { customAlphabet } from 'nanoid';

export function generateRandomString(length: number) {
  return customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', length)();
}

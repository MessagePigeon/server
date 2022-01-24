import { hash, verify } from 'argon2';

export async function signHashPassword(password: string) {
  return await hash(password);
}

export async function verifyHashPassword(hash: string, password: string) {
  return await verify(hash, password);
}

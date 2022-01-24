import { hash, verify } from 'argon2';

export async function encodeHashPassword(password: string) {
  return await hash(password);
}

export async function decodeHashPassword(hash: string, password: string) {
  return await verify(hash, password);
}

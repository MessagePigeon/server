import { hash } from 'argon2';

export default async function hashPassword(password: string) {
  return await hash(password);
}

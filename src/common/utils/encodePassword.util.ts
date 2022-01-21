import { hashSync } from 'bcryptjs';

export default function encodePassword(password: string) {
  return hashSync(password, 8);
}

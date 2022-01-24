import { Injectable } from '@nestjs/common';
import { PrismaService } from '~~/services/prisma.service';
import {
  decodeHashPassword,
  encodeHashPassword,
} from '~~/utils/hashPassword.util';

@Injectable()
export class TeacherService {
  constructor(private readonly db: PrismaService) {}

  async checkRegisterCodeValid(registerCode: string) {
    const isRegisterCodeValidData = await this.db.registerCode.findFirst({
      where: { code: registerCode },
      select: { used: true },
    });
    const isRegisterCodeStatusValid = isRegisterCodeValidData
      ? !isRegisterCodeValidData.used
      : false;
    return isRegisterCodeStatusValid;
  }

  async checkUsernameExist(username: string) {
    const isUsernameExistData = await this.db.teacher.findUnique({
      where: { username },
    });
    const isUsernameExist = isUsernameExistData !== null;
    return isUsernameExist;
  }

  async updateRegisterCode(registerCode: string) {
    return await this.db.registerCode.update({
      where: { code: registerCode },
      data: { used: true },
    });
  }

  async create(username: string, password: string, fullName: string) {
    return await this.db.teacher.create({
      data: {
        username,
        password: await encodeHashPassword(password),
        fullName,
      },
      select: { username: true, fullName: true },
    });
  }

  async checkPasswordHash(username: string, password: string) {
    const { password: passwordHash } = await this.db.teacher.findUnique({
      where: { username },
    });
    return await decodeHashPassword(passwordHash, password);
  }

  async getId(username: string) {
    const { id } = await this.db.teacher.findUnique({ where: { username } });
    return id;
  }

  async init(id: string) {
    const { password, ...info } = await this.db.teacher.findUnique({
      where: { id },
    });
    return info;
  }
}

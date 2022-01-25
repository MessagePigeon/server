import { Injectable } from '@nestjs/common';
import { PrismaService } from '~~/services/prisma.service';
import {
  verifyHashPassword,
  signHashPassword,
} from '~/common/utils/hash-password.util';

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

  async create(username: string, password: string, realName: string) {
    return await this.db.teacher.create({
      data: {
        username,
        password: await signHashPassword(password),
        realName,
      },
      select: { username: true, realName: true },
    });
  }

  async checkPasswordHash(username: string, password: string) {
    const { password: passwordHash } = await this.db.teacher.findUnique({
      where: { username },
    });
    return await verifyHashPassword(passwordHash, password);
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

import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/services/prisma.service';
import encodePassword from '~/utils/encodePassword.util';

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

  async checkUserNameRepeated(username: string) {
    const isUsernameRepeatedData = await this.db.teacher.findUnique({
      where: { username },
    });
    const isUsernameRepeated = isUsernameRepeatedData !== null;
    return isUsernameRepeated;
  }

  async updateRegisterCode(registerCode: string) {
    return await this.db.registerCode.update({
      where: { code: registerCode },
      data: { used: true },
    });
  }

  async createTeacher(username: string, password: string, fullName: string) {
    return await this.db.teacher.create({
      data: { username, password: encodePassword(password), fullName },
      select: { username: true, fullName: true },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import encodePassword from 'src/common/utils/encodePassword.util';

@Injectable()
export class TeacherService {
  constructor(private db: PrismaService) {}

  async checkRegisterCode(registerCode: string) {
    const registerCodeStatusData = await this.db.registerCode.findFirst({
      where: { code: registerCode },
      select: { used: true },
    });
    const registerCodeStatus = registerCodeStatusData
      ? !registerCodeStatusData.used
      : false;
    if (registerCodeStatus) {
      await this.db.registerCode.update({
        where: { code: registerCode },
        data: { used: true },
      });
    }
    return registerCodeStatus;
  }

  async register(username: string, password: string, fullName: string) {
    return await this.db.teacher.create({
      data: { username, password: encodePassword(password), fullName },
      select: { username: true, fullName: true },
    });
  }
}

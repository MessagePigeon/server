import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '~/services/prisma.service';
import encodePassword from '~/utils/encodePassword.util';

@Injectable()
export class TeacherService {
  constructor(private readonly db: PrismaService) {}

  private async checkRegisterCode(registerCode: string) {
    const isRegisterCodeValidData = await this.db.registerCode.findFirst({
      where: { code: registerCode },
      select: { used: true },
    });
    const isRegisterCodeStatusValid = isRegisterCodeValidData
      ? !isRegisterCodeValidData.used
      : false;
    if (isRegisterCodeStatusValid) {
      await this.db.registerCode.update({
        where: { code: registerCode },
        data: { used: true },
      });
    }
    return isRegisterCodeStatusValid;
  }

  private async createTeacher(
    username: string,
    password: string,
    fullName: string,
  ) {
    return await this.db.teacher.create({
      data: { username, password: encodePassword(password), fullName },
      select: { username: true, fullName: true },
    });
  }

  async register(
    registerCode: string,
    username: string,
    password: string,
    fullName: string,
  ) {
    const isRegisterCodeStatusValid = await this.checkRegisterCode(
      registerCode,
    );
    if (isRegisterCodeStatusValid) {
      return await this.createTeacher(username, password, fullName);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}

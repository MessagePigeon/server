import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/common/services/prisma.service';

@Injectable()
export class StudentService {
  constructor(private readonly db: PrismaService) {}

  async checkKeyExist(key: string) {
    const isKeyExistData = await this.db.student.findUnique({ where: { key } });
    const isKeyExist = isKeyExistData !== null;
    return isKeyExist;
  }

  async findIdByKey(key: string) {
    const { id } = await this.db.student.findUnique({
      where: { key },
      select: { id: true },
    });
    return id;
  }

  async init(id: string) {
    const { key, ...info } = await this.db.student.findUnique({
      where: { id },
    });
    return info;
  }
}

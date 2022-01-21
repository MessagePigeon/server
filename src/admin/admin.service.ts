import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '~/services/prisma.service';

@Injectable()
export class AdminService {
  constructor(private db: PrismaService) {}

  async createRegisterCodes(count: number) {
    const generateCode = customAlphabet(
      'abcdefghijklmnopqrstuvwxyz1234567890',
      32,
    );
    if (count === 1) {
      const code = generateCode();
      return await this.db.registerCode.create({
        data: { code },
        select: { id: true, code: true },
      });
    } else {
      const codes: { code: string; id: number }[] = [];
      for (let i = 0; i < count; i++) {
        const code = generateCode();
        const codeData = await this.db.registerCode.create({
          data: { code },
          select: { id: true, code: true },
        });
        codes.push(codeData);
      }
      return codes;
    }
  }

  async findRegisterCode(skip: number, take: number, used?: boolean) {
    if (used === undefined) {
      return await this.db.registerCode.findMany({
        select: { id: true, code: true, used: true },
        skip,
        take,
      });
    } else {
      return await this.db.registerCode.findMany({
        where: { used },
        select: { id: true, code: true },
        skip,
        take,
      });
    }
  }
}

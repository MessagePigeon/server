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
      const largestIdData = await this.db.registerCode.findFirst({
        select: { id: true },
        orderBy: {
          id: 'desc',
        },
      });
      const largestId = largestIdData === null ? 0 : largestIdData.id;

      const codes = new Array(count)
        .fill(null)
        .map(() => ({ code: generateCode() }));
      await this.db.registerCode.createMany({
        data: codes,
      });

      return codes.map(({ code }, index) => ({
        id: largestId + 1 + index,
        code,
      }));
    }
  }

  async findRegisterCode(skip: number, take: number, used?: boolean) {
    return await this.db.registerCode.findMany({
      select: { id: true, code: true, used: used === undefined },
      where: used === undefined ? undefined : { used },
      skip,
      take,
    });
  }
}

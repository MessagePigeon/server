import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateRandomString } from '~/common/utils/generate-random-string.util';
import { signHashPassword } from '~/common/utils/hash-password.util';
import { PrismaService } from '~~/services/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly db: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generateRegisterCodes(count: number) {
    if (count === 1) {
      const code = generateRandomString(32);
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
        .map(() => ({ code: generateRandomString(32) }));
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
    const data = await this.db.registerCode.findMany({
      select: { id: true, code: true, used: used === undefined },
      where: used === undefined ? undefined : { used },
      skip,
      take,
    });
    const total = await this.db.registerCode.count();
    return { data, total };
  }

  checkPassword(password: string) {
    const isPasswordValid =
      password === this.configService.get<string>('ADMIN_PASSWORD');
    return isPasswordValid;
  }

  async generateTeacher(username: string, fullName: string) {
    const password = generateRandomString(8);
    const { id } = await this.db.teacher.create({
      data: { username, password: await signHashPassword(password), fullName },
      select: { id: true },
    });
    return { id, username, password, fullName };
  }
}

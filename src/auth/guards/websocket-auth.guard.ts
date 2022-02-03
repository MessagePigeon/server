import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '~/prisma/prisma.service';
import { AuthService } from '../auth.service';

type WsData = {
  token: string;
  role: 'student' | 'teacher';
  userId: string;
};

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    try {
      const data = context.switchToWs().getData<WsData>();
      const { token, role } = data;
      const { userId } = await this.authService.verifyJwtWithId(token);
      let isIdExist: boolean;
      if (role === 'student') {
        isIdExist =
          (await this.db.student.findUnique({
            where: { id: userId },
          })) !== null;
      } else {
        isIdExist =
          (await this.db.teacher.findUnique({
            where: { id: userId },
          })) !== null;
      }
      if (isIdExist) {
        data.userId = userId;
      }
      return isIdExist;
    } catch (error) {
      return false;
    }
  }
}

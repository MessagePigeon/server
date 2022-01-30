import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '~/common/services/prisma.service';
import { AuthService } from '../auth.service';

@Injectable()
export class StudentWsAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    try {
      const data = context.switchToWs().getData();
      const { token } = data;
      const { userId } = await this.authService.verifyJwtWithId(token);
      const isIdExist =
        (await this.db.student.findUnique({
          where: { id: userId },
        })) !== null;
      if (isIdExist) {
        data.userId = userId;
      }
      return isIdExist;
    } catch (error) {
      return false;
    }
  }
}

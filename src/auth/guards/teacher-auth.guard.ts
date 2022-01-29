import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '~/common/services/prisma.service';
import { AuthService } from '../auth.service';

@Injectable()
export class TeacherAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = this.authService.getBearerTokenFromRequest(request);
    const { authStatus, userId } = await this.authService.verifyJwtWithId(
      token,
    );
    const isIdExist =
      (await this.db.teacher.findUnique({
        where: { id: userId },
      })) !== null;
    if (isIdExist && authStatus) {
      request.userId = userId;
    }
    return isIdExist && authStatus;
  }
}

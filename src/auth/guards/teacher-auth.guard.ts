import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '~/prisma/prisma.service';
import { AuthService } from '../auth.service';

@Injectable()
export class TeacherAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest();
      const token = this.authService.getBearerTokenFromRequest(request);
      const { userId } = await this.authService.verifyJwtWithId(token);
      const isIdExist =
        (await this.db.teacher.findUnique({
          where: { id: userId },
        })) !== null;
      if (isIdExist) {
        const { ban } = await this.db.teacher.findUnique({
          where: { id: userId },
          select: { ban: true },
        });
        if (ban) {
          throw new Error();
        }
        request.userId = userId;
      }
      return isIdExist;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}

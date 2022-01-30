import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    try {
      const token = this.authService.getBearerTokenFromRequest(
        context.switchToHttp().getRequest(),
      );
      return await this.authService.verifyAdminJwt(token);
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}

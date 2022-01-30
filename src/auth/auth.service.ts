import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signJwtWithId(id: string) {
    const payload = { id };
    const token = await this.jwtService.signAsync(payload);
    return { token };
  }

  async verifyJwtWithId(token: string) {
    const { id } = await this.jwtService.verifyAsync<{ id: string }>(token);
    return { userId: id };
  }

  async signAdminJwt() {
    const payload = { message: 'pigeon' };
    const token = await this.jwtService.signAsync(payload);
    return { token };
  }

  async verifyAdminJwt(token: string) {
    const payload = await this.jwtService.verifyAsync(token);
    return payload.message === 'pigeon';
  }

  getBearerTokenFromRequest(request: { headers: { authorization: string } }) {
    return request.headers.authorization.slice(7);
  }
}

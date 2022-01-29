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
    try {
      const { id } = await this.jwtService.verifyAsync<{ id: string }>(token);
      return { authStatus: true, userId: id };
    } catch (error) {
      return { authStatus: false };
    }
  }

  async signAdminJwt() {
    const payload = { message: 'pigeon' };
    const token = await this.jwtService.signAsync(payload);
    return { token };
  }

  async verifyAdminJwt(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload.message === 'pigeon';
    } catch (error) {
      return false;
    }
  }

  getBearerTokenFromRequest(request: { headers: { authorization: string } }) {
    return request.headers.authorization.slice(7);
  }
}

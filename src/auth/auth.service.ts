import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateTeacherJwt(id: string) {
    const payload = { id };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  async generateAdminJwt() {
    const payload = { message: 'pigeon' };
    const token = this.jwtService.sign(payload);
    return { token };
  }
}

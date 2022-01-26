import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private generateJwtWithId(id: string) {
    const payload = { id };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  generateAdminJwt() {
    const payload = { message: 'pigeon' };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  generateTeacherJwt(id: string) {
    return this.generateJwtWithId(id);
  }

  generateStudentJwt(id: string) {
    return this.generateJwtWithId(id);
  }
}

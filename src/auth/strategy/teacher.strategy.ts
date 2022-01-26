import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '~/common/services/prisma.service';

@Injectable()
export class TeacherStrategy extends PassportStrategy(Strategy, 'teacher') {
  constructor(
    private readonly configService: ConfigService,
    private readonly db: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { id: string }) {
    const userExists = await this.db.teacher.findUnique({
      where: { id: payload.id },
    });
    if (userExists !== null) {
      return { id: payload.id };
    }
  }
}

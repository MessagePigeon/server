import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '~/common/services/prisma.service';
import { AdminStrategy } from './strategy/admin.strategy';
import { AuthService } from './auth.service';
import { StudentStrategy } from './strategy/student.strategy';
import { TeacherStrategy } from './strategy/teacher.strategy';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
  ],
  providers: [
    AuthService,
    PrismaService,
    AdminStrategy,
    TeacherStrategy,
    StudentStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}

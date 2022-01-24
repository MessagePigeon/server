import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '~/services/prisma.service';
import { AdminStrategy } from './admin.strategy';
import { AuthService } from './auth.service';
import { TeacherStrategy } from './teacher.strategy';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
  ],
  providers: [AuthService, AdminStrategy, TeacherStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}

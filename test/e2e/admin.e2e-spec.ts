import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '~/app.module';
import { PrismaService } from '~/prisma/prisma.service';

describe('Admin', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.get(PrismaService).enableShutdownHooks(app);
    app.useWebSocketAdapter(new WsAdapter(app));
    configService = moduleRef.get<ConfigService>(ConfigService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    return await app.close();
  });

  describe('unauthorized', () => {
    it('login', async () => {
      const password = configService.get<string>('ADMIN_PASSWORD');
      return await request(app.getHttpServer())
        .post('/admin/login')
        .send({ password })
        .expect(200);
    });
  });

  describe('authorized', () => {
    const authRequest: request.SuperTest;
  });
});

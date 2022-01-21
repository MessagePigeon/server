import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaService } from '~/services/prisma.service';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Message Pigeon')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  const prismaService: PrismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  await app.listen(3000);
}
bootstrap();

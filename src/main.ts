import { NestFactory } from '@nestjs/core';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';
import { applyGlobalMiddlewares } from './app.middlewares';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prismaSessionStore = new PrismaSessionStore(new PrismaClient(), {
    checkPeriod: 2 * 60 * 1000,
  });
  applyGlobalMiddlewares(app, prismaSessionStore);

  await app.listen(parseInt(process.env.PORT || '3000', 10));
}
bootstrap();

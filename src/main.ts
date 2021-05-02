import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import * as passport from 'passport';
import * as csurf from 'csurf';
import { AppModule } from './app.module';
import { PrismaClient } from '.prisma/client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  /**
   * クッキーベースのセッション管理と、CSRF対策を行う
   * これらとあわせて、PassportのLocalAuthGuardでセッションを確立するため、
   * Passportの必要なミドルウェアもバインドしている
   *
   * ※ serializer/deserializerはauthモジュール内でSessionSerializerクラスを作成
   */
  app.enableCors({
    credentials: true,
    origin: process.env.CORS_ALLOWED_ORIGIN,
  });

  app.use(
    session({
      secret: process.env.SECRET_KEY as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
      store: new PrismaSessionStore(new PrismaClient(), {
        checkPeriod: 2 * 60 * 1000,
      }),
    }),
  );

  app.use(csurf());
  app.use((err: any, req: any, res: any, next: any) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    throw new ForbiddenException();
  });

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(parseInt(process.env.PORT || '3000', 10));
}
bootstrap();

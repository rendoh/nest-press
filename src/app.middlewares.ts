import {
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { NextFunction } from 'express';
import * as csurf from 'csurf';
import * as session from 'express-session';
import * as passport from 'passport';

export function applyGlobalMiddlewares(
  app: INestApplication,
  prismaSessionStore: PrismaSessionStore,
) {
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
        secure:
          process.env.NODE_ENV !== 'development' &&
          process.env.NODE_ENV !== 'test',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
      store: prismaSessionStore,
    }),
  );

  app.use(csurf());
  app.use((err: any, _: never, __: never, next: NextFunction) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    throw new ForbiddenException();
  });

  app.use(passport.initialize());
  app.use(passport.session());
}

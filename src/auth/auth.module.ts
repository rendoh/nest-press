import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';
import { UsersModule } from '../users/users.module';
import { SessionSerializer } from './session.serializer';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, PrismaService, LocalStrategy, SessionSerializer],
  controllers: [AuthController],
})
export class AuthModule {}

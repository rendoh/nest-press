import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, Request } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('csrftoken')
  async getCsrfToken(@Req() req: Request) {
    return {
      csrfToken: req.csrfToken(),
    };
  }
}

import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request) {
    return req.user;
  }

  @Get('csrftoken')
  async getCsrfToken(@Req() req: Request) {
    return {
      csrfToken: req.csrfToken(),
    };
  }
}

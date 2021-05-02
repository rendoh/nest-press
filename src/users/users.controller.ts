import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUser } from './interfaces/public-user.interface';
import { SessionAuthGuard } from 'src/auth/guards/session-auth.guard';
import { AuthenticatedRequest } from 'express';
import { PrivateUser } from './interfaces/private-user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.paginate({
      page,
      limit,
    });
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  async findMyself(@Req() req: AuthenticatedRequest): Promise<PrivateUser> {
    return this.usersService.findPrivateUser(req.user.id);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<PublicUser> {
    return this.usersService.findById(+id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('me')
  update(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @UseGuards(SessionAuthGuard)
  @Delete('me')
  remove(@Req() req: AuthenticatedRequest) {
    return this.usersService.delete(req.user.id);
  }
}

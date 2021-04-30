import { Prisma, User } from '.prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUser } from './interfaces/public-user.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name } = createUserDto;
    const alreadyExist = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (alreadyExist) {
      throw new BadRequestException(
        'Cannot register because the email address is already registered.',
      );
    }

    const passwordHash = await hash(password, 10);
    return this.prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
      },
    });
  }

  async paginate({
    page = 1,
    limit = 10,
  }: {
    page?: number;
    limit?: number;
  } = {}): Promise<PublicUser[]> {
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: number): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { email } = updateUserDto;
    if (email) {
      const userWithSameEmail = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (userWithSameEmail && userWithSameEmail.id !== id) {
        throw new BadRequestException(
          'Cannot register because the email address is already registered.',
        );
      }
    }

    return this.prisma.user.update({
      data: updateUserDto,
      where: {
        id,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.onDelete({
      model: 'User',
      where: {
        id,
      },
    });
  }
}

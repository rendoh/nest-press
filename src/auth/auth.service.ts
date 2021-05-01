import { Injectable } from '@nestjs/common';
import { compare } from 'bcrypt';
import { PublicUser } from 'src/users/interfaces/public-user.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
  async validateUser(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (await compare(password, user.password)) {
      const { id, name } = user;
      return { id, name };
    }
    return null;
  }
}

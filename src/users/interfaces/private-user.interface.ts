import { PublicUser } from './public-user.interface';

export interface PrivateUser extends Omit<PublicUser, 'email'> {
  id: number;
  name: string;
  email: string;
}

import * as faker from 'faker';
import { User } from '@prisma/client';
import { PublicUser } from '../interfaces/public-user.interface';
import { PrivateUser } from '../interfaces/private-user.interface';

export const fakeUser = (user: Partial<User> = {}): User => ({
  id: faker.datatype.number(),
  name: faker.internet.userName(),
  email: faker.internet.exampleEmail(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
  password: faker.internet.password(),
  ...user,
});

export const fakePublicUser = (
  publicUser: Partial<PublicUser> = {},
): PublicUser => ({
  id: faker.datatype.number(),
  name: faker.internet.userName(),
  ...publicUser,
});

export const fakePrivateUser = (
  privateUser: Partial<PrivateUser> = {},
): PrivateUser => ({
  id: faker.datatype.number(),
  name: faker.internet.userName(),
  email: faker.internet.exampleEmail(),
  ...privateUser,
});

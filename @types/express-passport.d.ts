import { PublicUser } from 'src/users/interfaces/public-user.interface';

export {};

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends PublicUser {}
  }
}

declare module 'express' {
  type AuthenticatedRequest = Express.AuthenticatedRequest;
}

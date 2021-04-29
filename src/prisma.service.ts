import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaDelete } from '@paljs/plugins';

type OnDeleteArgsForModel<T extends Prisma.ModelName, WhereInput> = {
  model: T;
  where: WhereInput;
  deleteParent?: boolean;
};

type OnDeleteArgs =
  | OnDeleteArgsForModel<'User', Prisma.UserWhereInput>
  | OnDeleteArgsForModel<'Post', Prisma.PostWhereInput>;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async onDelete(args: OnDeleteArgs) {
    const prismaDelete = new PrismaDelete(this);
    await prismaDelete.onDelete(args);
  }
}

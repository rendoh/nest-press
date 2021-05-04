import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma.service';
import { PrivateUser } from './interfaces/private-user.interface';
import { PublicUser } from './interfaces/public-user.interface';
import {
  fakePrivateUser,
  fakePublicUser,
  fakeUser,
} from './test-utils/fake-user';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrismaService: MockProxy<PrismaService> & PrismaService;

  beforeEach(async () => {
    mockPrismaService = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ユーザ作成', () => {
    const user = fakeUser();
    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
    };
    beforeEach(() => {
      mockPrismaService.user.create.mockResolvedValue(publicUser as any);
    });
    test('作成したユーザのパブリック情報が返される', async () => {
      const createdPublicUser = await service.create({
        email: user.email,
        name: user.name,
        password: user.password,
      });

      expect(mockPrismaService.user.create.mock.calls[0][0].select).toEqual({
        id: true,
        name: true,
      });
      expect(createdPublicUser).toEqual(publicUser);
    });

    test('ハッシュ化したパスワードが保存される', async () => {
      await service.create({
        email: user.email,
        name: user.name,
        password: user.password,
      });
      expect(mockPrismaService.user.create.mock.calls[0][0].data.email).toBe(
        user.email,
      );
      expect(
        mockPrismaService.user.create.mock.calls[0][0].data.password,
      ).not.toBe(user.password);
    });

    test('すでにEmailが登録されている場合はユーザを作成できない', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      expect(
        service.create({
          email: user.email,
          name: user.name,
          password: user.password,
        }),
      ).rejects.toThrowError(BadRequestException);
      expect(mockPrismaService.user.create).not.toBeCalled();
    });
  });

  describe('ユーザ一覧Pagination', () => {
    const count = 10;
    const publicUsers = [...Array(10)].map(() => fakePublicUser());
    beforeEach(() => {
      mockPrismaService.$transaction.mockResolvedValue([count, publicUsers]);
    });
    test('全件数とユーザリストを取得できる', async () => {
      expect(await service.paginate()).toEqual({
        count,
        data: publicUsers,
      });
      expect(mockPrismaService.user.count).toBeCalled();
    });
    test('作成日時降順の先頭10件数の公開情報クエリが発行される', async () => {
      await service.paginate();
      expect(mockPrismaService.user.findMany).toBeCalledWith({
        skip: 0,
        take: 10,
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
    test('ページ送りのクエリが正しく発行される', async () => {
      const params = [
        {
          limit: 10,
          page: 2,
        },
        {
          limit: 100,
          page: 100,
        },
        {
          limit: 15,
          page: 5,
        },
      ];
      for (const [index, { limit, page }] of params.entries()) {
        await service.paginate({ limit, page });
        const args = mockPrismaService.user.findMany.mock.calls[index][0];
        expect(args?.take).toBe(limit);
        expect(args?.skip).toBe((page - 1) * limit);
      }
    });
  });

  describe('ユーザIDによる検索ができる', () => {
    const user = fakeUser();
    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
    };
    const privateUser: PrivateUser = {
      ...publicUser,
      email: user.email,
    };
    beforeEach(() => {
      mockPrismaService.user.findUnique.mockImplementation((async ({
        select: { email },
      }: any) => (email ? privateUser : publicUser)) as any);
    });
    test('IDによる検索ができ、公開情報のみが含まれる', async () => {
      const resultUser = await service.findById(user.id);
      expect(resultUser).toEqual(publicUser);
      expect(
        mockPrismaService.user.findUnique.mock.calls[0][0].select?.email,
      ).toBeFalsy();
    });
    test('Eメールアドレスを含んで取得できる', async () => {
      const resultUser = await service.findById(user.id, true);
      expect(resultUser).toEqual(privateUser);
      expect(
        mockPrismaService.user.findUnique.mock.calls[0][0].select?.email,
      ).toBe(true);
    });
  });

  describe('ユーザ情報更新', () => {
    const privateUser = fakePrivateUser();
    beforeEach(() => {
      mockPrismaService.user.update.mockResolvedValue(privateUser as any);
      mockPrismaService.user.findUnique.mockResolvedValue(fakeUser());
    });
    test('ユーザ情報を更新できる', async () => {
      const data = { name: 'name' };
      const result = await service.update(1, data);
      expect(mockPrismaService.user.update).toBeCalledWith({
        data,
        where: {
          id: 1,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      expect(result).toEqual(privateUser);
    });

    test('登録済みメールアドレスを入力（他のユーザと重複）した場合はエラーが発生する', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(fakeUser());
      mockPrismaService.user.findUnique.mockResolvedValueOnce(
        fakeUser({ id: 999 }),
      );
      expect(service.update(1, { email: 'email@example.com' })).rejects.toThrow(
        BadRequestException,
      );
    });

    test('登録済みメールアドレスを入力（自分自身と同じ）した場合はそのまま更新できる', async () => {
      const myself = fakeUser();
      mockPrismaService.user.findUnique.mockResolvedValueOnce(myself);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(myself);
      await service.update(myself.id, { email: myself.email });
      expect(mockPrismaService.user.update).toBeCalled();
    });
  });

  test('外部キー制約のためにユーザをonDeleteで削除することができる', async () => {
    await service.delete(1);
    expect(mockPrismaService.onDelete).toBeCalledWith({
      model: 'User',
      where: {
        id: 1,
      },
    });
    expect(mockPrismaService.user.delete).not.toBeCalled();
  });
});

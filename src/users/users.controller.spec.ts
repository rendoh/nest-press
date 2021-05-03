import * as faker from 'faker';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { fakePrivateUser, fakePublicUser } from './test-utils/fake-user';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthenticatedRequest } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const mockUserService = {
      paginate: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findPrivateUser: jest.fn(),
      update: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  test('ページネーションされたユーザ一覧が取得できる', async () => {
    const result = {
      count: 1,
      data: [fakePublicUser()],
    };
    jest.spyOn(usersService, 'paginate').mockResolvedValue(result);

    expect(await controller.findAll(1, 10)).toEqual(result);
    expect(usersService.paginate).toBeCalledWith({ page: 1, limit: 10 });
  });

  test('ユーザを作成できる', async () => {
    const createUserDto: CreateUserDto = {
      email: faker.internet.email(),
      name: faker.internet.userName(),
      password: faker.internet.password(),
    };
    await controller.create(createUserDto);
    expect(usersService.create).toBeCalledWith(createUserDto);
  });

  test('ユーザ情報を取得できる', async () => {
    const result = fakePublicUser();
    jest.spyOn(usersService, 'findById').mockResolvedValue(result);
    expect(await controller.findById(result.id.toString())).toEqual(result);
    expect(usersService.findById).toBeCalledWith(result.id);
  });

  test('認証済みユーザ自身の情報を取得できる', async () => {
    const result = fakePrivateUser();
    const authenticatedRequest = {
      user: {
        id: result.id,
      },
    } as AuthenticatedRequest;
    jest.spyOn(usersService, 'findById').mockResolvedValue(result as any);
    expect(await controller.findMyself(authenticatedRequest)).toEqual(result);
    expect(usersService.findById).toBeCalledWith(result.id, true);
  });
});

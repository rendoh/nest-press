import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { AppModule } from '../src/app.module';
import { applyGlobalMiddlewares } from '../src/app.middlewares';
import * as faker from 'faker';
import * as request from 'supertest';

export class TestingApp {
  private prismaSessionStore!: PrismaSessionStore;
  public prisma!: PrismaClient;
  public app!: INestApplication;
  public superUser!: User;
  public superAgent!: request.SuperAgentTest;
  public csrfToken = '';

  public static password = 'P@ssw0rd';

  public async setUp() {
    this.prisma = new PrismaClient();
    await this.prisma.$connect();

    this.prismaSessionStore = new PrismaSessionStore(this.prisma, {
      checkPeriod: 2 * 60 * 1000,
    });
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    applyGlobalMiddlewares(this.app, this.prismaSessionStore);
    await this.app.init();
    await this.createSuperUser();
  }

  public async tearDown() {
    await this.prismaSessionStore.shutdown();
    await this.prisma.$disconnect();
    await this.app.close();
  }

  public getHttpServer() {
    return this.app.getHttpServer();
  }

  private async createSuperUser() {
    this.superUser = await this.prisma.user.create({
      data: {
        name: faker.internet.userName(),
        email: faker.internet.exampleEmail(),
        password: await hash(TestingApp.password, 10),
      },
    });

    this.superAgent = request.agent(this.getHttpServer());
    const {
      body: { csrfToken },
    } = await this.superAgent.get('/auth/csrftoken').send();
    this.csrfToken = csrfToken;
    await this.superAgent
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .set('X-XSRF-TOKEN', csrfToken)
      .send({
        email: this.superUser.email,
        password: TestingApp.password,
      });
  }
}

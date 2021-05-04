import { HttpStatus } from '@nestjs/common';
import { hash } from 'bcrypt';
import * as request from 'supertest';
import { fakeUser } from '../src/users/test-utils/fake-user';
import { TestingApp } from './utils';

describe('UsersController (e2e)', () => {
  const testingApp = new TestingApp();

  beforeEach(async () => {
    await testingApp.setUp();
  });

  afterEach(async () => {
    await testingApp.tearDown();
  });

  test('Access-Controll-Allow-Originヘッダーに値が設定されている', async () => {
    const { headers } = await request(testingApp.getHttpServer()).get(
      '/auth/csrftoken',
    );
    expect(headers['access-control-allow-origin']).toBe('http://localhost');
  });

  test('CSRFトークンを取得できる', async () => {
    const {
      body: { csrfToken },
    } = await request(testingApp.getHttpServer())
      .get('/auth/csrftoken')
      .expect(200);
    expect(csrfToken).toBeTruthy();
  });

  test('CSRFトークンが渡されていない場合ログインできない', async () => {
    const password = 'P@ssw0rd';
    const passwordHash = await hash(password, 10);
    const { name, email } = fakeUser({ password });
    await testingApp.prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
      },
    });
    return request(testingApp.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(HttpStatus.FORBIDDEN);
  });

  test('CSRFトークンが不正の場合ログインできない', async () => {
    const password = 'P@ssw0rd';
    const passwordHash = await hash(password, 10);
    const { name, email } = fakeUser({ password });
    await testingApp.prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
      },
    });

    const {
      body: { csrfToken },
    } = await request(testingApp.getHttpServer())
      .get('/auth/csrftoken')
      .expect(200);
    expect(csrfToken).toBeTruthy();

    return request(testingApp.getHttpServer())
      .post('/auth/login')
      .set('X-XSRF-TOKEN', csrfToken)
      .send({
        email,
        password,
      })
      .expect(HttpStatus.FORBIDDEN);
  });

  test('正しいCSRFトークンが渡された場合ログインでき、HttpOnlyのセッションIDが格納されている', async () => {
    const password = 'P@ssw0rd';
    const passwordHash = await hash(password, 10);
    const { name, email } = fakeUser({ password });
    await testingApp.prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
      },
    });

    const agent = request.agent(testingApp.getHttpServer());

    const {
      body: { csrfToken },
    } = await agent.get('/auth/csrftoken');

    const { headers } = await agent
      .post('/auth/login')
      .set('X-XSRF-TOKEN', csrfToken)
      .send({
        email,
        password,
      })
      .expect(200);
    const setCookie: string[] = headers['set-cookie'];
    const sessionIdCookie = setCookie.find((val) =>
      val.startsWith('connect.sid'),
    );
    expect(sessionIdCookie?.includes('HttpOnly')).toBe(true);
  });
});

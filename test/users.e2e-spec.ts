import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { TestingApp } from './utils';

describe('UsersController (e2e)', () => {
  const testingApp = new TestingApp();

  beforeEach(async () => {
    await testingApp.setUp();
  });

  afterEach(async () => {
    await testingApp.tearDown();
  });

  test('認証済みでないユーザは権限を持たずアクセスできない', async () => {
    return request(testingApp.getHttpServer())
      .get('/users/me')
      .expect(HttpStatus.FORBIDDEN);
  });

  test('認証済みユーザは自身の情報を取得できる', async () => {
    const { body } = await testingApp.superAgent.get('/users/me').expect(200);
    expect(body).toEqual({
      id: testingApp.superUser.id,
      name: testingApp.superUser.name,
      email: testingApp.superUser.email,
    });
  });
});

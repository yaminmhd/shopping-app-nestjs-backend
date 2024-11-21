import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(cookieParser());
    await app.init();
  });

  it('POST /users)', async () => {
    const beforeCount = await prismaService.user.count();
    const { status, body } = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'user1@test.com',
        password: 'P@ssword123!',
      });

    const afterCount = await prismaService.user.count();

    expect(status).toBe(201);
    expect(body).toEqual(
      expect.objectContaining({
        id: 1,
        email: 'user1@test.com',
      }),
    );
    expect(afterCount - beforeCount).toBe(1);
  });

  it('should POST /auth/login', async () => {
    const result = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'user1@test.com',
      password: 'P@ssword123!',
    });

    expect(result.status).toBe(201);
    expect(result.headers['set-cookie']).toBeDefined();
    authToken = result.headers['set-cookie'];
  });

  it('should GET /users/me authenticated', async () => {
    const { status, body } = await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', [`${authToken}`]);

    expect(status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        userId: 1,
        iat: expect.any(Number),
        exp: expect.any(Number),
      }),
    );
  });
});

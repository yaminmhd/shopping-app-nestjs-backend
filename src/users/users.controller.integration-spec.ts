import { INestApplication, ValidationPipe } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Result } from 'oxide.ts';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';

describe('UsersController', () => {
  let app: INestApplication;
  let usersService: DeepMocked<UsersService>;
  let jwtToken: string;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: createMock<UsersService>(),
        },
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => 'test-secret',
          },
        },
      ],
    }).compile();

    usersService = moduleFixture.get(UsersService);
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.init();

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    jwtToken = jwtService.sign({ userId: '1' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST users', () => {
    (usersService.createUser as jest.Mock).mockResolvedValue(
      Result({ id: 1, email: 'hello@example.com' }),
    );

    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'hello@example.com',
        password: 'P@ssword123!',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
        expect(response.body).not.toHaveProperty('password');
      });
  });

  it('/GET users/me unauthorized', () => {
    return request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('/GET users/me authorized', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', [`Authentication=${jwtToken}`])
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveProperty('userId');
        expect(response.body).toHaveProperty('iat');
        expect(response.body).toHaveProperty('exp');
      });
  });
});

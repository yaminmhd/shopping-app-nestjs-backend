import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';

describe('AuthController', () => {
  let app: INestApplication;
  let authService: DeepMocked<AuthService>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: createMock<AuthService>(),
        },
        LocalStrategy,
      ],
    }).compile();

    authService = moduleFixture.get(AuthService);
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST auth/login', () => {
    const authServiceResponse = {
      tokenPayload: {
        userId: 1,
      },
    };
    (authService.login as jest.Mock).mockResolvedValue(authServiceResponse);
    (authService.verifyUser as jest.Mock).mockResolvedValue(true);

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'hello@example.com',
        password: 'P@ssword123!',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toHaveProperty('tokenPayload');
        expect(response.body.tokenPayload).toEqual(
          authServiceResponse.tokenPayload,
        );
      });
  });

  it('should return 401 if credentials are invalid', () => {
    (authService.verifyUser as jest.Mock).mockRejectedValue(
      new UnauthorizedException('Credentials are not valid'),
    );

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'hello@example.com',
        password: 'P@ssword123!',
      })
      .expect(401)
      .expect((response) => {
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toEqual('Credentials are not valid');
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toEqual('Unauthorized');
        expect(response.body).toHaveProperty('statusCode');
        expect(response.body.statusCode).toEqual(401);
      });
  });
});

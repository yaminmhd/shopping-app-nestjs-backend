import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: DeepMocked<JwtService>;
  let usersService: DeepMocked<UsersService>;
  let response: DeepMocked<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: createMock<UsersService>(),
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => '10h',
          },
        },
        {
          provide: JwtService,
          useValue: createMock<JwtService>(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);
    response = createMock<Response>();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokenPayload when login is triggered', async () => {
      const user: User = {
        id: 1,
        email: 'a@test.com',
        password: 'password',
      };
      const tokenPayload = { userId: 1 };

      const signedToken = {
        userId: 1,
        iat: 1730952509,
        exp: 1730988509,
      };
      (jwtService.sign as jest.Mock).mockReturnValue(signedToken);

      const result = await service.login(user, response);

      expect(response.cookie).toHaveBeenCalledWith(
        'Authentication',
        signedToken,
        { secure: true, httpOnly: true, expires: expect.any(Date) },
      );
      expect(result.tokenPayload).toEqual(tokenPayload);
    });
  });

  describe('verification', () => {
    it('should return user when users are verified', async () => {
      const user = {
        id: 123,
        email: 'a@test.com',
        password: 'hashedPassword',
      };
      (usersService.getUser as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyUser('a@test.com', 'test');
      expect(result).toEqual(user);
    });

    it('should return UnauthorizedException when user is not authenticated', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyUser('a@test.com', 'test')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return UnauthorizedException with message when error is thrown', async () => {
      (usersService.getUser as jest.Mock).mockRejectedValue('error');

      await expect(service.verifyUser('a@test.com', 'test')).rejects.toThrow(
        new UnauthorizedException('Credentials are not valid'),
      );
    });
  });
});

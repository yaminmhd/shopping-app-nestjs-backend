import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CreateUserRequest } from './dto/create-user.request';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Err, Result } from 'oxide.ts';
import { UnprocessableEntityException } from '@nestjs/common';
import { TokenPayload } from '../auth/token-payload.interface';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: DeepMocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: createMock<UsersService>(),
        },
        JwtStrategy,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const payload: CreateUserRequest = {
      email: 'a@test.com',
      password: 'password123',
    };

    it('should call createUser with the correct payload', async () => {
      const createdUser = {
        id: 1,
        email: 'a@test.com',
      };
      const createUserSpy = (
        usersService.createUser as jest.Mock
      ).mockResolvedValue(Result(createdUser));

      await controller.createUser(payload);
      expect(createUserSpy).toHaveBeenCalledWith(payload);
    });

    it('should throw UnprocessableEntityException if createUser fails', async () => {
      const createUserSpy = (
        usersService.createUser as jest.Mock
      ).mockResolvedValue(
        Err(new UnprocessableEntityException('User email exists')),
      );

      await expect(controller.createUser(payload)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(createUserSpy).toHaveBeenCalledWith(payload);
    });

    it('should handle other errors accordingly', async () => {
      (usersService.createUser as jest.Mock).mockResolvedValue(
        Err(new Error('Some error')),
      );

      await expect(controller.createUser(payload)).rejects.toThrow();
    });
  });

  describe('getUsers', () => {
    const mockUser: TokenPayload = {
      userId: 1,
    };

    it('should return the current user', () => {
      const result = controller.getMe(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('guards', () => {
    it('should use JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getMe);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });
  });

  describe('create user request validation', () => {
    it('should validate email format', async () => {
      const invalidPayload: CreateUserRequest = {
        email: 'invalid-email.com',
        password: '123',
      };

      await expect(controller.createUser(invalidPayload)).rejects.toThrow();
    });

    it('should validate password requirements', async () => {
      const invalidPayload: CreateUserRequest = {
        email: 'valid@email.com',
        password: '123',
      };

      await expect(controller.createUser(invalidPayload)).rejects.toThrow();
    });
  });
});

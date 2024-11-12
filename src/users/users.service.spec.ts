import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnprocessableEntityException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserRequest } from './dto/create-user.request';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: DeepMocked<PrismaService>;

  /* manually mocking dependencies for service
  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  */

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockHashedPassword = 'hashedPassword123';
    const mockCreatedUser = {
      id: 1,
      email: 'test@example.com',
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
    });

    it('should successfully create a user', async () => {
      const createUserSpy = (
        prismaService.user.create as jest.Mock
      ).mockResolvedValue(mockCreatedUser);
      const result = await service.createUser(createUserDto);

      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toEqual(mockCreatedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(createUserSpy).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: mockHashedPassword,
        },
        select: {
          id: true,
          email: true,
        },
      });
    });

    it('should return error when email already exists', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      (prismaService.user.create as jest.Mock).mockRejectedValue(prismaError);

      const result = await service.createUser(createUserDto);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr()).toBeInstanceOf(UnprocessableEntityException);
      expect(result.unwrapErr().message).toBe('Email already exists');
    });

    it('should throw error for other database errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      (prismaService.user.create as jest.Mock).mockRejectedValue(
        unexpectedError,
      );

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getUser', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
    };

    it('should successfully find a user', async () => {
      const getUserSpy = (
        prismaService.user.findUniqueOrThrow as jest.Mock
      ).mockResolvedValue(mockUser);

      const result = await service.getUser({ id: 1 });

      expect(result).toEqual(mockUser);
      expect(getUserSpy).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error when user is not found', async () => {
      const error = new Error('User not found');
      (prismaService.user.findUniqueOrThrow as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(service.getUser({ id: 999 })).rejects.toThrow(
        'User not found',
      );
    });
  });
});

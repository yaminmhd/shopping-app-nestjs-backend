import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { User } from '@prisma/client';
import { LocalAuthGuard } from './guards/local-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: DeepMocked<AuthService>;
  let response: DeepMocked<Response>;
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: createMock<AuthService>(),
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    response = createMock<Response>();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService when login is triggered', async () => {
      const tokenResult = { tokenPayload: 'token' };
      (authService.login as jest.Mock).mockResolvedValue(tokenResult);

      const result = await controller.login(mockUser, response);

      expect(result).toEqual(tokenResult);
      expect(authService.login).toHaveBeenCalledWith(mockUser, response);
    });

    it('should handle errors', () => {
      const error = new Error('Error');
      (authService.login as jest.Mock).mockRejectedValue(error);

      expect(() => controller.login(mockUser, response)).rejects.toThrowError(
        error,
      );
    });
  });

  describe('guards', () => {
    it('should use LocalAuthGuard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        AuthController.prototype.login,
      );
      expect(guards).toBeDefined();
      expect(guards[0]).toBe(LocalAuthGuard);
    });
  });
});

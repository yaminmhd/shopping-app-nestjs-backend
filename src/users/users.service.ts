import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CreateUserRequest } from './dto/create-user.request';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Err, Ok, Result } from 'oxide.ts';

type UserDto = Pick<User, 'id' | 'email'>;

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(data: CreateUserRequest): Promise<Result<UserDto, Error>> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await this.prismaService.user.create({
        data: { ...data, password: hashedPassword },
        select: { id: true, email: true },
      });
      return Ok(user);
    } catch (error) {
      if (error.code === 'P2002') {
        return Err(new UnprocessableEntityException('Email already exists'));
      }
      throw error;
    }
  }
}

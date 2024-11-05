import {
  Body,
  Controller,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserRequest } from './dto/create-user.request';
import { UsersService } from './users.service';
import { match } from 'oxide.ts';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() request: CreateUserRequest) {
    const result = await this.usersService.createUser(request);
    return match(result, {
      Ok: (user) => user,
      Err: (error: Error) => {
        if (error instanceof UnprocessableEntityException) {
          throw new UnprocessableEntityException('User email exists');
        }
      },
    });
  }
}

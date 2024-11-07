import {
  Body,
  Controller,
  Post,
  Get,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { CreateUserRequest } from './dto/create-user.request';
import { UsersService } from './users.service';
import { match } from 'oxide.ts';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { TokenPayload } from 'src/auth/token-payload.interface';

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: TokenPayload) {
    return user;
  }
}

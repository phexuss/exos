import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { AuthPayloadDto, RefreshTokenDto } from 'src/auth/dto/auth.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import {
  CreateUserDto,
  CreateUserResponseDto,
} from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.userService.createUser(dto);
  }

  @Post('login')
  async login(@Body() dto: AuthPayloadDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: Request) {
    return req.user;
  }
}

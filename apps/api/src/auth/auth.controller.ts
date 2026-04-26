import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import {
  AuthPayloadDto,
  AuthStatusResponseDto,
  AuthTokenResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  LogoutResponseDto,
  RefreshTokenDto,
} from 'src/auth/dto/auth.dto';
import {
  ResendCodeDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
} from 'src/auth/dto/verify-email.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import {
  CreateUserDto,
  CreateUserResponseDto,
} from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({
    summary: 'Register new user account and send verification code',
  })
  @ApiCreatedResponse({
    description: 'User account has been created and verification email queued',
    type: CreateUserResponseDto,
  })
  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const user = await this.userService.createUser(dto);
    await this.authService.sendVerificationEmail(user.id, user.email);
    return user;
  }

  @ApiOperation({ summary: 'Login and issue tokens' })
  @ApiCreatedResponse({
    description: 'Access and refresh tokens issued',
    type: AuthTokenResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Post('login')
  async login(@Body() dto: AuthPayloadDto): Promise<AuthTokenResponseDto> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Refresh token pair' })
  @ApiCreatedResponse({
    description: 'Access and refresh tokens refreshed',
    type: AuthTokenResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token or session' })
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Logout from current refresh session' })
  @ApiCreatedResponse({
    description: 'Session invalidated',
    type: LogoutResponseDto,
  })
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto): Promise<LogoutResponseDto> {
    await this.authService.logout(dto.refreshToken);
    return { success: true };
  }

  @ApiOperation({ summary: 'Get auth payload of current access token' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Current access token payload',
    type: AuthStatusResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: Request): Promise<AuthStatusResponseDto> {
    return req.user as AuthStatusResponseDto;
  }

  @ApiOperation({ summary: 'Verify email with 6-digit code' })
  @ApiCreatedResponse({
    description: 'Email has been verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired verification code',
  })
  @Post('verify')
  async verify(@Body() dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(dto.userId, dto.code);
  }

  @ApiOperation({ summary: 'Resend verification code email' })
  @ApiCreatedResponse({ description: 'Verification email has been queued' })
  @Post('verify/resend')
  async resendCode(@Body() dto: ResendCodeDto): Promise<void> {
    await this.authService.sendVerificationEmail(dto.userId, dto.email);
  }

  @ApiOperation({ summary: 'Change password of the current user' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Password has been changed',
    type: ChangePasswordResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing/invalid bearer token or wrong current password',
  })
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const { sub } = req.user as AuthStatusResponseDto;
    await this.authService.changePassword(
      sub,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true };
  }
}

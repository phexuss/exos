import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
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
import { Public } from 'src/auth/decorators/public.decorator';
import {
  AuthPayloadDto,
  AuthStatusResponseDto,
  AuthTokenResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  ForgotPasswordDto,
  LogoutResponseDto,
  PasswordResetResponseDto,
  RefreshTokenDto,
  ResetPasswordDto,
  VerifyPasswordResetCodeDto,
  VerifyPasswordResetCodeResponseDto,
} from 'src/auth/dto/auth.dto';
import {
  ResendCodeDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
} from 'src/auth/dto/verify-email.dto';
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
  @Public()
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
  @Public()
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
  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Logout from current refresh session' })
  @ApiCreatedResponse({
    description: 'Session invalidated',
    type: LogoutResponseDto,
  })
  @Public()
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
  @Public()
  @Post('verify')
  async verify(@Body() dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(dto.userId, dto.code);
  }

  @ApiOperation({ summary: 'Resend verification code email' })
  @ApiCreatedResponse({ description: 'Verification email has been queued' })
  @Public()
  @Post('verify/resend')
  async resendCode(@Body() dto: ResendCodeDto): Promise<void> {
    await this.authService.sendVerificationEmail(dto.userId, dto.email);
  }

  @ApiOperation({ summary: 'Send password reset code email' })
  @ApiCreatedResponse({
    description: 'Password reset email has been queued when account exists',
    type: PasswordResetResponseDto,
  })
  @Public()
  @Post('password/forgot')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<PasswordResetResponseDto> {
    await this.authService.requestPasswordReset(dto.email);
    return { success: true };
  }

  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiCreatedResponse({
    description: 'Password reset code has been verified',
    type: VerifyPasswordResetCodeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired password reset code',
  })
  @Public()
  @Post('password/verify')
  async verifyPasswordResetCode(
    @Body() dto: VerifyPasswordResetCodeDto,
  ): Promise<VerifyPasswordResetCodeResponseDto> {
    return this.authService.verifyPasswordResetCode(dto.email, dto.code);
  }

  @ApiOperation({ summary: 'Reset password with verified reset token' })
  @ApiCreatedResponse({
    description: 'Password has been reset',
    type: PasswordResetResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired password reset token',
  })
  @Public()
  @Post('password/reset')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<PasswordResetResponseDto> {
    await this.authService.resetPassword(dto.resetToken, dto.newPassword);
    return { success: true };
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

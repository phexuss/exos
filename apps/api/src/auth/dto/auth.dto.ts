import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class AuthPayloadDto {
  @ApiProperty({
    description: 'Unique username used for authentication',
    minLength: 2,
    maxLength: 36,
    example: 'phexuss',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 36)
  username!: string;

  @ApiProperty({
    description: 'Plain password with minimum length of 8 characters',
    minLength: 8,
    example: 'S3curePass123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token issued by login or refresh endpoint',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.payload.signature',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class AuthTokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.payload.signature',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.payload.signature',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Access token type',
    enum: ['Bearer'],
    example: 'Bearer',
  })
  tokenType!: 'Bearer';

  @ApiProperty({
    description: 'Configured access token lifetime expression',
    example: '15m',
  })
  accessExpiresIn!: string;
}

export class LogoutResponseDto {
  @ApiProperty({ description: 'Logout result flag', example: true })
  success!: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    minLength: 8,
    example: 'OldPass123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  currentPassword!: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    minLength: 8,
    example: 'NewPass4567',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword!: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ description: 'Password change result flag', example: true })
  success!: boolean;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Account email to receive a password reset code',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'Short-lived token issued after password reset code verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.reset.payload.signature',
  })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    minLength: 8,
    example: 'NewPass4567',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword!: string;
}

export class VerifyPasswordResetCodeDto {
  @ApiProperty({
    description: 'Account email that received the reset code',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '6-digit password reset code sent by email',
    minLength: 6,
    maxLength: 6,
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must contain 6 digits' })
  code!: string;
}

export class VerifyPasswordResetCodeResponseDto {
  @ApiProperty({
    description: 'Short-lived token for setting a new password',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.reset.payload.signature',
  })
  resetToken!: string;
}

export class PasswordResetResponseDto {
  @ApiProperty({
    description: 'Password reset flow result flag',
    example: true,
  })
  success!: boolean;
}

export class AuthStatusResponseDto {
  @ApiProperty({ description: 'User id from token payload', format: 'uuid' })
  sub!: string;

  @ApiProperty({
    description: 'Username from token payload',
    example: 'phexuss',
  })
  username!: string;

  @ApiProperty({
    description: 'Session id from token payload',
    format: 'uuid',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Issued-at timestamp in unix seconds',
    example: 1713956400,
    required: false,
  })
  iat?: number;

  @ApiProperty({
    description: 'Expiration timestamp in unix seconds',
    example: 1713957300,
    required: false,
  })
  exp?: number;
}

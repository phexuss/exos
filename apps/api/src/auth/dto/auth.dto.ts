import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class AuthPayloadDto {
  @ApiProperty({
    description: 'Unique username used for authentication',
    minLength: 2,
    maxLength: 36,
    example: 'phexuss',
  })
  @IsString()
  @Length(2, 36)
  username!: string;

  @ApiProperty({
    description: 'Plain password with minimum length of 8 characters',
    minLength: 8,
    example: 'S3curePass123',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token issued by login or refresh endpoint',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.payload.signature',
  })
  @IsString()
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

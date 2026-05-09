import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'User id to verify',
    format: 'uuid',
    example: 'e5d8ae50-6dd9-47f7-831f-1544d5cb42bd',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: '6-digit verification code sent by email',
    minLength: 6,
    maxLength: 6,
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class ResendCodeDto {
  @ApiProperty({
    description: 'User id to send verification code for',
    format: 'uuid',
    example: 'e5d8ae50-6dd9-47f7-831f-1544d5cb42bd',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'Destination email for verification code',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  email!: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({ description: 'Verification result flag', example: true })
  success!: boolean;

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

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
}

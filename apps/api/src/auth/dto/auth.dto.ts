import { IsString, Length, MinLength } from 'class-validator';

export class AuthPayloadDto {
  @IsString()
  @Length(2, 36)
  username!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

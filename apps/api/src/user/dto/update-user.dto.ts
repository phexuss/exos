import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Display name',
    minLength: 1,
    maxLength: 16,
    example: 'Phexuss',
  })
  @IsOptional()
  @IsString()
  @Length(1, 16)
  name?: string;

  @ApiPropertyOptional({
    description: 'Unique username',
    minLength: 2,
    maxLength: 36,
    example: 'phexuss',
  })
  @IsOptional()
  @IsString()
  @Length(2, 36)
  username?: string;

  @ApiPropertyOptional({
    description: 'User email. Changing email will reset verification status.',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;
}

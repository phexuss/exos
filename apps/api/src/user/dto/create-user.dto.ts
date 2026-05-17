import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Display name',
    minLength: 1,
    maxLength: 16,
    example: 'Phexuss',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 16)
  name!: string;

  @ApiProperty({
    description: 'Unique user email',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({
    description: 'Unique username',
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

export class CreateUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  passwordHash!: string;

  @ApiProperty({ example: false })
  isVerified!: boolean;

  @ApiPropertyOptional({ nullable: true })
  verifyToken?: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  verifyTokenExp?: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class UserPublicDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ example: false })
  isVerified!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class UserProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(1, 16)
  name!: string;
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;
  @IsString()
  @Length(2, 36)
  username!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export class CreateUserResponseDto {
  id!: string;
  name!: string;
  username!: string;
  email!: string;
  createdAt!: Date;
}

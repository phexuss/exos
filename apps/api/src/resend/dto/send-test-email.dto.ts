import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class SendTestEmailDto {
  @ApiProperty({
    description: 'Destination email',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '6-digit code to include in test email',
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

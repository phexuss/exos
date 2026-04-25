import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class SendTestEmailDto {
  @ApiProperty({
    description: 'Destination email',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '6-digit code to include in test email',
    minLength: 6,
    maxLength: 6,
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}

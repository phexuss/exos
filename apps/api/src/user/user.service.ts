import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateUserDto,
  CreateUserResponseDto,
} from 'src/user/dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const hashedPassword = await argon2.hash(dto.password);

    const newUser = await this.prismaService.user.create({
      data: {
        name: dto.name,
        username: dto.username,
        email: dto.email,
        passwordHash: hashedPassword,
      },
    });
    return {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  }

  async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    return user;
  }

  async findByUsername(username: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    return user;
  }
}

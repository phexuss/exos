import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateUserDto,
  CreateUserResponseDto,
  UserPublicDto,
} from 'src/user/dto/create-user.dto';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private toPublic(user: {
    id: string;
    name: string;
    email: string;
    username: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserPublicDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createUser(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const existingByEmail = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });
    if (existingByEmail) {
      throw new ConflictException('Email is already in use');
    }
    const existingByUsername = await this.prismaService.user.findUnique({
      where: { username: dto.username },
    });
    if (existingByUsername) {
      throw new ConflictException('Username is already taken');
    }

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

  async setVerificationCode(
    id: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id },
      data: { verifyToken: code, verifyTokenExp: expiresAt },
    });
  }

  async getMe(id: string): Promise<UserPublicDto> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublic(user);
  }

  async updateProfile(
    id: string,
    dto: UpdateUserDto,
  ): Promise<{ user: UserPublicDto; emailChanged: boolean }> {
    const current = await this.prismaService.user.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('User not found');
    }

    if (dto.username && dto.username !== current.username) {
      const taken = await this.prismaService.user.findUnique({
        where: { username: dto.username },
      });
      if (taken && taken.id !== id) {
        throw new ConflictException('Username is already taken');
      }
    }

    const emailChanged = !!dto.email && dto.email !== current.email;
    if (emailChanged) {
      const taken = await this.prismaService.user.findUnique({
        where: { email: dto.email as string },
      });
      if (taken && taken.id !== id) {
        throw new ConflictException('Email is already in use');
      }
    }

    const updated = await this.prismaService.user.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        username: dto.username ?? undefined,
        email: dto.email ?? undefined,
        isVerified: emailChanged ? false : undefined,
        verifyToken: emailChanged ? null : undefined,
        verifyTokenExp: emailChanged ? null : undefined,
      },
    });

    return { user: this.toPublic(updated), emailChanged };
  }
}

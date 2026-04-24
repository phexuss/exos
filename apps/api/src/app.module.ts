import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AlbumsModule } from './albums/albums.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArtistsModule } from './artists/artists.module';
import { AuthModule } from './auth/auth.module';
import { ColorModule } from './color/color.module';
import { DownloadModule } from './download/download.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { ResendModule } from './resend/resend.module';
import { SearchModule } from './search/search.module';
import { TracksModule } from './tracks/tracks.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        SWAGGER_ENABLED: Joi.boolean().default(true),
        YTDLP_PATH: Joi.string().optional(),
        YTDLP_TIMEOUT_MS: Joi.number().default(10000),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES: Joi.string().required(),
        JWT_REFRESH_EXPIRES: Joi.string().required(),
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: require('cache-manager-ioredis'),
        url: process.env.REDIS_URL,
        tls: true,
        ttl: 60 * 60 * 24,
      }),
    }),
    PrismaModule,
    ProvidersModule,
    SearchModule,
    TracksModule,
    ArtistsModule,
    AlbumsModule,
    LyricsModule,
    DownloadModule,
    ColorModule,
    UserModule,
    ResendModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

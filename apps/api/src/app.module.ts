import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AlbumsModule } from './albums/albums.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArtistsModule } from './artists/artists.module';
import { AuthModule } from './auth/auth.module';
import { DownloadModule } from './download/download.module';
import { LibraryModule } from './library/library.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { RedisModule } from './redis/redis.module';
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

        SWAGGER_ENABLED: Joi.boolean().default(false),
        YTDLP_PATH: Joi.string().optional(),
        YTDLP_TIMEOUT_MS: Joi.number().default(10000),
        YTDLP_MAX_CONCURRENT: Joi.number().integer().min(1).default(3),
        YTDLP_STREAM_URL_PROBE: Joi.string().valid('0', '1').optional(),
        YTDLP_YOUTUBE_EXTRACTOR_ARGS: Joi.string().optional().allow(''),
        YTDLP_YOUTUBE_BOT_CHECK_COOLDOWN_SEC: Joi.number()
          .integer()
          .min(30)
          .default(300),
        STREAM_DIRECT_HOSTS: Joi.string().optional().allow(''),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES: Joi.string().required(),
        JWT_REFRESH_EXPIRES: Joi.string().required(),

        LASTFM_API_KEY: Joi.string().optional().allow(''),
        RESEND_API_KEY: Joi.string().required(),
        RESEND_TEST_ENDPOINT_ENABLED: Joi.boolean().default(false),

        YTDLP_COOKIES_PATH: Joi.string().optional(),
      }),
    }),
    RedisModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: require('cache-manager-ioredis'),
        url: process.env.REDIS_URL,

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
    LibraryModule,
    DownloadModule,
    UserModule,
    ResendModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

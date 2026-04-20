import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AlbumsModule } from './albums/albums.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArtistsModule } from './artists/artists.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { SearchModule } from './search/search.module';
import { TracksModule } from './tracks/tracks.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { DownloadModule } from './download/download.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

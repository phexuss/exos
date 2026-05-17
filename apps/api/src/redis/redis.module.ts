import { Global, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis, { type Redis } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

class RedisLifecycle implements OnModuleDestroy {
  constructor(private readonly client: Redis) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const url = config.getOrThrow<string>('REDIS_URL');

        const client = new IORedis(url, {
          lazyConnect: false,
          maxRetriesPerRequest: 3,

          enableReadyCheck: false,

          keepAlive: 15000,

          retryStrategy: (times) => Math.min(200 * 2 ** (times - 1), 3000),
        });

        const logger = new Logger('Redis');
        client.on('error', (error) => {
          logger.error(`Redis client error: ${error.message}`);
        });
        client.on('connect', () => {
          logger.log('Redis client connected');
        });

        return client;
      },
    },
    {
      provide: RedisLifecycle,
      inject: [REDIS_CLIENT],
      useFactory: (client: Redis) => new RedisLifecycle(client),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

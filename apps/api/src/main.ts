import { type LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

const PROD_ALLOWED_ORIGINS: string[] = [];
const DEV_ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,

  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
];

function buildCorsOriginFn(isProd: boolean) {
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (PROD_ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    if (
      !isProd &&
      DEV_ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
    ) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  };
}

function resolveLogLevels(isProd: boolean): LogLevel[] {
  return isProd
    ? ['error', 'warn']
    : ['error', 'warn', 'log', 'debug', 'verbose'];
}

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProd = nodeEnv === 'production';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: resolveLogLevels(isProd),
  });
  const configService = app.get(ConfigService);

  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false }));

  app.enableShutdownHooks();

  app.enableCors({
    origin: buildCorsOriginFn(isProd),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerEnabled =
    !isProd && configService.get<boolean>('SWAGGER_ENABLED') === true;
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Exos API')
      .setDescription(
        'API documentation for Exos backend. OpenAPI JSON is available at /docs-json for Orval generation.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

bootstrap().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: bootstrap-failure exit path
  console.error('Fatal: failed to bootstrap Nest application', error);
  process.exit(1);
});

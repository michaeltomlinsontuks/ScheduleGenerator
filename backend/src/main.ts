import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { QueryTimeoutInterceptor } from './common/interceptors/query-timeout.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // trust proxy is required for secure cookies to work behind the Fly.io proxy
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // Session configuration for Passport
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'tuks-schedule-generator-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    }),
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // CORS configuration - support multiple origins
  const frontendUrl = configService.get<string>('frontend.url');
  const allowedOrigins = [
    frontendUrl,
    'https://schedgen-frontend.fly.dev',
    'https://tuks-pdf-calendar.co.za',
    'https://www.tuks-pdf-calendar.co.za',
  ].filter(Boolean); // Remove any undefined values

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In development, allow localhost
      if (process.env.NODE_ENV !== 'production' && origin?.includes('localhost')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global query timeout interceptor (30 seconds)
  app.useGlobalInterceptors(new QueryTimeoutInterceptor(30000));

  // Global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tuks Schedule Generator API')
    .setDescription(
      'API for converting Tuks schedule PDFs into calendar events',
    )
    .setVersion('3.0.0')
    .addOAuth2({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          scopes: {
            'https://www.googleapis.com/auth/calendar': 'Google Calendar access',
          },
        },
      },
    })
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port') ?? 3001;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();

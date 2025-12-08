import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/config.module.js';
import { CacheModule } from './cache/cache.module.js';
import { UploadModule } from './upload/upload.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { ParserModule } from './parser/parser.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { HealthModule } from './health/health.module.js';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

@Module({
  imports: [
    AppConfigModule,
    CacheModule,
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds (1 minute)
        limit: 100, // 100 requests per minute (default)
      },
    ]),
    UploadModule,
    JobsModule,
    ParserModule,
    AuthModule,
    CalendarModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply CustomThrottlerGuard globally (adds rate limit headers)
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    // Apply LoggingInterceptor globally (adds request ID and user ID to logs)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }

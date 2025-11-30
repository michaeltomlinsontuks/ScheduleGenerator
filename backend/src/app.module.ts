import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/config.module.js';
import { Job } from './jobs/entities/job.entity.js';
import { StorageModule } from './storage/storage.module.js';
import { UploadModule } from './upload/upload.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { ParserModule } from './parser/parser.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { HealthModule } from './health/health.module.js';
import { CacheModule } from './cache/cache.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard.js';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

@Module({
  imports: [
    AppConfigModule,
    CacheModule,
    MetricsModule,
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds (1 minute)
        limit: 100, // 100 requests per minute (default)
      },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [Job],
        autoLoadEntities: true,
        synchronize: false, // Disabled to use migrations instead
        // Connection pool configuration
        extra: {
          max: 50, // Maximum connections in pool
          min: 10, // Minimum connections in pool
          connectionTimeoutMillis: 30000, // 30 seconds to acquire connection
          idleTimeoutMillis: 30000, // 30 seconds idle timeout
          statement_timeout: 10000, // 10 seconds query timeout
        },
        // Connection retry logic
        retryAttempts: 3,
        retryDelay: 3000, // 3 seconds between retry attempts
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
      }),
    }),
    StorageModule,
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
    // Apply MetricsInterceptor globally (tracks HTTP request duration)
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}

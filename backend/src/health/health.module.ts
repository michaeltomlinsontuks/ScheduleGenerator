import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { RedisHealthIndicator } from './indicators/redis.health.js';
import { MinioHealthIndicator } from './indicators/minio.health.js';
import { DatabaseHealthIndicator } from './indicators/database.health.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    RedisHealthIndicator,
    MinioHealthIndicator,
    DatabaseHealthIndicator,
  ],
})
export class HealthModule {}

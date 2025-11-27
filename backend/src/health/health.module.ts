import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { RedisHealthIndicator } from './indicators/redis.health.js';
import { MinioHealthIndicator } from './indicators/minio.health.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, MinioHealthIndicator],
})
export class HealthModule {}

import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisHealthIndicator } from './indicators/redis.health.js';
import { MinioHealthIndicator } from './indicators/minio.health.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private minio: MinioHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check health status of all dependencies' })
  @ApiResponse({
    status: 200,
    description: 'Health check passed',
  })
  @ApiResponse({
    status: 503,
    description: 'One or more health checks failed',
  })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
      () => this.minio.isHealthy('minio'),
    ]);
  }
}

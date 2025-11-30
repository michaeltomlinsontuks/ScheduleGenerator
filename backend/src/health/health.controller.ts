import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisHealthIndicator } from './indicators/redis.health.js';
import { MinioHealthIndicator } from './indicators/minio.health.js';
import { DatabaseHealthIndicator } from './indicators/database.health.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private database: DatabaseHealthIndicator,
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
      () => this.database.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () => this.minio.isHealthy('minio'),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({
    summary: 'Check database health with connection pool metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Database health check passed with pool metrics',
  })
  @ApiResponse({
    status: 503,
    description: 'Database health check failed',
  })
  async checkDatabase(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.isHealthy('database')]);
  }
}

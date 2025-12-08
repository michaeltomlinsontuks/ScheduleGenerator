import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';


@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
  ) { }

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
    return this.health.check([]);
  }
}


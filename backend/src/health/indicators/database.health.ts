import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface DatabasePoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
}

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);
  private readonly MAX_CONNECTIONS = 50; // Should match TypeORM config
  private readonly WARNING_THRESHOLD = 0.8; // 80% utilization

  constructor(@InjectDataSource() private dataSource: DataSource) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Set 5-second timeout for health check
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 5000);
      });

      const healthCheckPromise = this.performHealthCheck();

      const metrics = await Promise.race([healthCheckPromise, timeoutPromise]);

      return this.getStatus(key, true, metrics);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new HealthCheckError(
        `${key} health check failed`,
        this.getStatus(key, false, { message: errorMessage }),
      );
    }
  }

  private async performHealthCheck(): Promise<DatabasePoolMetrics> {
    // Perform a simple query to verify database connectivity
    await this.dataSource.query('SELECT 1');

    // Get connection pool metrics
    const poolMetrics = await this.getPoolMetrics();

    // Check for connection pool exhaustion
    const utilizationRatio =
      poolMetrics.totalConnections / this.MAX_CONNECTIONS;

    if (utilizationRatio >= 1.0) {
      // Pool is at maximum capacity
      this.logger.error({
        message: 'Database connection pool exhausted',
        totalConnections: poolMetrics.totalConnections,
        activeConnections: poolMetrics.activeConnections,
        idleConnections: poolMetrics.idleConnections,
        maxConnections: this.MAX_CONNECTIONS,
        utilizationPercent: '100%',
      });
    } else if (utilizationRatio >= this.WARNING_THRESHOLD) {
      // Pool is approaching capacity
      this.logger.warn({
        message: 'Database connection pool nearing exhaustion',
        totalConnections: poolMetrics.totalConnections,
        activeConnections: poolMetrics.activeConnections,
        idleConnections: poolMetrics.idleConnections,
        maxConnections: this.MAX_CONNECTIONS,
        utilizationPercent: `${Math.round(utilizationRatio * 100)}%`,
      });
    }

    return poolMetrics;
  }

  private async getPoolMetrics(): Promise<DatabasePoolMetrics> {
    try {
      // Query PostgreSQL to get connection statistics
      const result = await this.dataSource.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);

      if (result && result.length > 0) {
        return {
          totalConnections: parseInt(result[0].total_connections, 10),
          activeConnections: parseInt(result[0].active_connections, 10),
          idleConnections: parseInt(result[0].idle_connections, 10),
        };
      }

      // Fallback if query fails
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
      };
    } catch (error) {
      // Return zeros if we can't get metrics, but don't fail the health check
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
      };
    }
  }
}

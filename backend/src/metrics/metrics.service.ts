import { Injectable, Logger } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectMetric('database_connections')
    private readonly databaseConnections: Gauge<string>,
  ) {}

  /**
   * Update database connection metrics
   * Runs every 10 seconds to keep metrics fresh
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async updateDatabaseMetrics(): Promise<void> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);

      if (result && result[0]) {
        const { total_connections, active, idle } = result[0];
        
        this.databaseConnections.set({ state: 'total' }, parseInt(total_connections, 10));
        this.databaseConnections.set({ state: 'active' }, parseInt(active, 10));
        this.databaseConnections.set({ state: 'idle' }, parseInt(idle, 10));
      }
    } catch (error) {
      this.logger.error('Failed to update database metrics', error);
    }
  }
}

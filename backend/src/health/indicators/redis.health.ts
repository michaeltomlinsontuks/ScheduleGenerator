import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const host = this.configService.get<string>('redis.host') ?? 'localhost';
    const port = this.configService.get<number>('redis.port') ?? 6379;

    let client: RedisClientType | null = null;

    try {
      client = createClient({
        url: `redis://${host}:${port}`,
        socket: {
          connectTimeout: 5000,
        },
      });

      await client.connect();
      await client.ping();
      await client.quit();

      return this.getStatus(key, true);
    } catch (error) {
      if (client) {
        try {
          await client.quit();
        } catch {
          // Ignore cleanup errors
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new HealthCheckError(
        `${key} health check failed`,
        this.getStatus(key, false, { message: errorMessage }),
      );
    }
  }
}

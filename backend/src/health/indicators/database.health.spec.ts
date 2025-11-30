import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseHealthIndicator } from './database.health';
import { DataSource } from 'typeorm';
import { HealthCheckError } from '@nestjs/terminus';

describe('DatabaseHealthIndicator', () => {
  let indicator: DatabaseHealthIndicator;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseHealthIndicator,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    indicator = module.get<DatabaseHealthIndicator>(DatabaseHealthIndicator);
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  it('should return healthy status with pool metrics', async () => {
    // Mock successful database query
    mockDataSource.query
      .mockResolvedValueOnce(undefined) // SELECT 1 query
      .mockResolvedValueOnce([
        {
          total_connections: '15',
          active_connections: '5',
          idle_connections: '10',
        },
      ]); // Pool metrics query

    const result = await indicator.isHealthy('database');

    expect(result).toEqual({
      database: {
        status: 'up',
        totalConnections: 15,
        activeConnections: 5,
        idleConnections: 10,
      },
    });
  });

  it('should throw HealthCheckError on database failure', async () => {
    mockDataSource.query.mockRejectedValue(new Error('Connection failed'));

    await expect(indicator.isHealthy('database')).rejects.toThrow(
      HealthCheckError,
    );
  });

  it('should timeout after 5 seconds', async () => {
    // Mock a query that takes longer than 5 seconds
    mockDataSource.query.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 6000);
        }),
    );

    await expect(indicator.isHealthy('database')).rejects.toThrow(
      HealthCheckError,
    );
  }, 10000); // Increase Jest timeout for this test

  it('should return zero metrics if pool query fails', async () => {
    mockDataSource.query
      .mockResolvedValueOnce(undefined) // SELECT 1 query succeeds
      .mockRejectedValueOnce(new Error('Pool query failed')); // Pool metrics query fails

    const result = await indicator.isHealthy('database');

    expect(result).toEqual({
      database: {
        status: 'up',
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
      },
    });
  });
});

import { DataSource } from 'typeorm';
import { Job } from './jobs/entities/job.entity.js';
import { User } from './auth/entities/user.entity.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'up_schedule',
  entities: [Job, User],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: false,
  // Connection pool configuration
  extra: {
    max: 50, // Maximum connections in pool
    min: 10, // Minimum connections in pool
    connectionTimeoutMillis: 30000, // 30 seconds to acquire connection
    idleTimeoutMillis: 30000, // 30 seconds idle timeout
    statement_timeout: 10000, // 10 seconds query timeout
  },
});

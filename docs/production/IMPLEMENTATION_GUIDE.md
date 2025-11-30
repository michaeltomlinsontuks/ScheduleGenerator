# Production Scalability Implementation Guide

**Document Version**: 1.0  
**Last Updated**: 2024-11-30  
**Prerequisites**: Read [Scalability Assessment](./SCALABILITY_ASSESSMENT.md) first

## Overview

This guide provides step-by-step implementation instructions for making the UP Schedule Generator production-ready for high user loads. Each section includes code examples, configuration changes, and verification steps.

---

## Phase 1: Critical Fixes (Week 1)

### 1.1 PDF Worker Horizontal Scaling

**Goal**: Scale PDF workers to handle concurrent uploads

#### Step 1: Update Docker Compose Configuration

```yaml
# docker-compose.prod.yml
services:
  pdf-worker:
    build:
      context: ./pdf-worker
      dockerfile: Dockerfile
    deploy:
      replicas: 3  # Start with 3 workers
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      - PYTHONUNBUFFERED=1
      - PORT=5001
      - MAX_WORKERS=4  # Gunicorn workers per container
      - WORKER_TIMEOUT=120  # 2 minute timeout
      - MAX_REQUESTS=1000  # Restart worker after 1000 requests
      - MAX_REQUESTS_JITTER=100
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

#### Step 2: Update PDF Worker Dockerfile

```dockerfile
# pdf-worker/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpoppler-cpp-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash worker && \
    chown -R worker:worker /app
USER worker

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')" || exit 1

# Run with Gunicorn - use environment variables
CMD gunicorn app:app \
    -w ${MAX_WORKERS:-4} \
    -k uvicorn.workers.UvicornWorker \
    -b 0.0.0.0:5001 \
    --timeout ${WORKER_TIMEOUT:-120} \
    --max-requests ${MAX_REQUESTS:-1000} \
    --max-requests-jitter ${MAX_REQUESTS_JITTER:-100} \
    --access-logfile - \
    --error-logfile - \
    --log-level info
```

#### Step 3: Add Resource Limits to PDF Parser

```python
# pdf-worker/parser/pdf_parser.py
import signal
from contextlib import contextmanager

class TimeoutException(Exception):
    pass

@contextmanager
def timeout(seconds):
    """Context manager for timeout protection"""
    def signal_handler(signum, frame):
        raise TimeoutException(f"Operation timed out after {seconds} seconds")
    
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)

def parse_pdf(file_path: str) -> Dict[str, Any]:
    """Parse PDF with timeout protection"""
    try:
        with timeout(60):  # 60 second timeout
            # Existing parsing logic
            with pdfplumber.open(file_path) as pdf:
                # Limit to first 100 pages
                if len(pdf.pages) > 100:
                    raise ValueError("PDF exceeds maximum page limit (100 pages)")
                
                # Rest of parsing logic...
                pass
    except TimeoutException as e:
        raise ValueError(f"PDF parsing timeout: {str(e)}")
    except Exception as e:
        raise ValueError(f"PDF parsing failed: {str(e)}")
```

#### Verification

```bash
# Deploy with scaling
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale pdf-worker=3

# Verify 3 workers are running
docker ps | grep pdf-worker

# Check load balancing
for i in {1..10}; do
  curl http://localhost:5001/health
done

# Monitor resource usage
docker stats
```

---

### 1.2 Job Queue Configuration

**Goal**: Configure BullMQ for reliable job processing

#### Step 1: Update Jobs Module

```typescript
// backend/src/jobs/jobs.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Job } from './entities/job.entity.js';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { JobsProcessor } from './jobs.processor.js';
import { StorageModule } from '../storage/storage.module.js';
import { ParserModule } from '../parser/parser.module.js';

export const PDF_PROCESSING_QUEUE = 'pdf-processing';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BullModule.registerQueue({
      name: PDF_PROCESSING_QUEUE,
      defaultJobOptions: {
        // Retry configuration
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
        },
        // Timeout configuration
        timeout: 300000, // 5 minutes max per job
        // Cleanup configuration
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 5000, // Keep last 5000 failed jobs
        },
      },
      // Rate limiting
      limiter: {
        max: 10, // Process max 10 jobs per second
        duration: 1000,
      },
      settings: {
        // Concurrency per worker
        concurrency: 5,
        // Stalled job check interval
        stalledInterval: 30000, // 30 seconds
        maxStalledCount: 2, // Retry stalled jobs twice
      },
    }),
    StorageModule,
    forwardRef(() => ParserModule),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsProcessor],
  exports: [JobsService],
})
export class JobsModule {}
```

#### Step 2: Add Job Priority Support

```typescript
// backend/src/jobs/jobs.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Job, JobStatus, PdfType, ParsedEvent } from './entities/job.entity.js';
import { PDF_PROCESSING_QUEUE } from './jobs.module.js';

export enum JobPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1, // Lower number = higher priority
}

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectQueue(PDF_PROCESSING_QUEUE)
    private readonly pdfQueue: Queue,
  ) {}

  async createJob(
    s3Key: string,
    pdfType: PdfType,
    priority: JobPriority = JobPriority.NORMAL,
  ): Promise<Job> {
    const job = this.jobRepository.create({
      status: JobStatus.PENDING,
      pdfType,
      s3Key,
      result: null,
      error: null,
    });

    const savedJob = await this.jobRepository.save(job);

    // Add to queue with priority
    await this.pdfQueue.add(
      'process-pdf',
      {
        jobId: savedJob.id,
        s3Key,
        pdfType,
      },
      {
        priority,
        jobId: savedJob.id, // Use job ID for deduplication
      },
    );

    return savedJob;
  }

  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.pdfQueue.getWaitingCount(),
      this.pdfQueue.getActiveCount(),
      this.pdfQueue.getCompletedCount(),
      this.pdfQueue.getFailedCount(),
      this.pdfQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    };
  }

  // ... rest of existing methods
}
```

#### Step 3: Add Queue Monitoring Endpoint

```typescript
// backend/src/jobs/jobs.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service.js';

@ApiTags('jobs')
@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get queue metrics' })
  async getMetrics() {
    return this.jobsService.getQueueMetrics();
  }

  // ... rest of existing endpoints
}
```

#### Verification

```bash
# Check queue metrics
curl http://localhost:3001/api/jobs/metrics

# Expected response:
# {
#   "waiting": 5,
#   "active": 3,
#   "completed": 150,
#   "failed": 2,
#   "delayed": 0,
#   "total": 8
# }

# Monitor queue in real-time
watch -n 1 'curl -s http://localhost:3001/api/jobs/metrics | jq'
```

---

### 1.3 Database Connection Pool

**Goal**: Optimize database connections for high concurrency

#### Step 1: Update TypeORM Configuration

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [Job],
        autoLoadEntities: true,
        synchronize: false,
        // Connection pool configuration
        extra: {
          // Pool size
          max: 50, // Maximum connections
          min: 10, // Minimum connections
          // Timeouts
          connectionTimeoutMillis: 30000, // 30s to acquire connection
          idleTimeoutMillis: 30000, // 30s idle before closing
          statement_timeout: 10000, // 10s query timeout
          // Connection management
          allowExitOnIdle: false,
          // Logging
          log: ['error', 'warn'],
        },
        // Query logging in development
        logging: configService.get('NODE_ENV') === 'development',
        // Connection retry
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

#### Step 2: Add Database Health Check

```typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 5000 }),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({ summary: 'Database health check with connection pool info' })
  async checkDatabase() {
    const health = await this.db.pingCheck('database', { timeout: 5000 });
    
    // Add connection pool metrics
    // Note: This requires custom implementation based on TypeORM internals
    return {
      ...health,
      pool: {
        // These would come from TypeORM connection pool
        total: 50,
        idle: 35,
        active: 15,
      },
    };
  }
}
```

#### Step 3: Add Query Timeout Interceptor

```typescript
// backend/src/common/interceptors/query-timeout.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class QueryTimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(30000), // 30 second timeout for entire request
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('Request timeout'));
        }
        return throwError(() => err);
      }),
    );
  }
}
```

#### Verification

```bash
# Check database connections
docker exec -it schedgen-postgres psql -U schedgen -d schedgen -c "
  SELECT count(*) as total_connections,
         count(*) FILTER (WHERE state = 'active') as active,
         count(*) FILTER (WHERE state = 'idle') as idle
  FROM pg_stat_activity
  WHERE datname = 'schedgen';
"

# Monitor connection pool under load
# Run load test and watch connections
watch -n 1 'docker exec -it schedgen-postgres psql -U schedgen -d schedgen -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '\''schedgen'\'';"'
```

---

### 1.4 Redis Configuration

**Goal**: Configure Redis for reliability and performance

#### Step 1: Update Redis Configuration

```yaml
# docker-compose.prod.yml
services:
  redis:
    image: redis:7-alpine
    container_name: schedgen-redis
    restart: unless-stopped
    command: >
      redis-server
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --appendonly yes
      --appendfsync everysec
      --save 900 1
      --save 300 10
      --save 60 10000
      --tcp-backlog 511
      --timeout 300
      --tcp-keepalive 300
      --maxclients 10000
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2.5G
        reservations:
          cpus: '0.5'
          memory: 2G
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - schedgen
```

#### Step 2: Add Redis Caching Layer

```typescript
// backend/src/cache/cache.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('redis.host'),
            port: configService.get<number>('redis.port'),
          },
          ttl: 300, // 5 minutes default TTL
          max: 1000, // Max items in cache
        }),
      }),
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
```

#### Step 3: Add Caching to Job Status

```typescript
// backend/src/jobs/jobs.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getJobById(id: string): Promise<Job> {
    // Try cache first
    const cacheKey = `job:${id}`;
    const cached = await this.cacheManager.get<Job>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Fetch from database
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'JOB_NOT_FOUND',
        error: `Job with ID ${id} not found`,
      });
    }

    // Cache completed/failed jobs for longer
    const ttl = job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED
      ? 3600 // 1 hour
      : 60; // 1 minute for pending/processing

    await this.cacheManager.set(cacheKey, job, ttl);

    return job;
  }

  async updateJobStatus(
    id: string,
    status: JobStatus,
    result?: ParsedEvent[],
    error?: string,
  ): Promise<Job> {
    const job = await this.getJobById(id);

    job.status = status;
    if (result !== undefined) job.result = result;
    if (error !== undefined) job.error = error;
    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      job.completedAt = new Date();
    }

    const updated = await this.jobRepository.save(job);

    // Invalidate cache
    await this.cacheManager.del(`job:${id}`);

    return updated;
  }
}
```

#### Verification

```bash
# Check Redis memory usage
docker exec -it schedgen-redis redis-cli INFO memory

# Check cache hit rate
docker exec -it schedgen-redis redis-cli INFO stats | grep keyspace

# Monitor cache in real-time
docker exec -it schedgen-redis redis-cli MONITOR
```

---

### 1.5 Rate Limiting

**Goal**: Implement per-user and per-endpoint rate limiting

#### Step 1: Install Dependencies

```bash
cd backend
npm install @nestjs/throttler
```

#### Step 2: Configure Throttler Module

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Global rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'upload',
        ttl: 3600000, // 1 hour
        limit: 10, // 10 uploads per hour
      },
    ]),
    // ... other modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

#### Step 3: Apply Rate Limits to Upload Endpoint

```typescript
// backend/src/upload/upload.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';

@ApiTags('upload')
@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Throttle({ upload: { limit: 5, ttl: 60000 } }) // 5 uploads per minute
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload PDF file' })
  @ApiConsumes('multipart/form-data')
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.processPdf(file);
  }

  @Get('status/:jobId')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 status checks per minute
  @ApiOperation({ summary: 'Get job status' })
  async getStatus(@Param('jobId') jobId: string) {
    return this.uploadService.getJobStatus(jobId);
  }
}
```

#### Step 4: Add Rate Limit Headers

```typescript
// backend/src/common/interceptors/rate-limit-headers.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RateLimitHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      tap(() => {
        // Add rate limit headers
        response.setHeader('X-RateLimit-Limit', '100');
        response.setHeader('X-RateLimit-Remaining', '95');
        response.setHeader('X-RateLimit-Reset', Date.now() + 60000);
      }),
    );
  }
}
```

#### Verification

```bash
# Test rate limiting
for i in {1..15}; do
  curl -i http://localhost:3001/api/upload \
    -F "file=@test.pdf" \
    -H "X-User-Id: test-user"
  echo "Request $i"
  sleep 1
done

# Should see 429 Too Many Requests after limit exceeded
```

---

## Phase 2: Monitoring & Optimization (Week 2)

### 2.1 Prometheus Metrics

#### Step 1: Install Dependencies

```bash
cd backend
npm install @willsoto/nestjs-prometheus prom-client
```

#### Step 2: Configure Prometheus Module

```typescript
// backend/src/metrics/metrics.module.ts
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class MetricsModule {}
```

#### Step 3: Add Custom Metrics

```typescript
// backend/src/jobs/jobs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class JobsService {
  constructor(
    @InjectMetric('pdf_jobs_total')
    private readonly jobsCounter: Counter<string>,
    @InjectMetric('pdf_processing_duration_seconds')
    private readonly processingDuration: Histogram<string>,
  ) {}

  async createJob(s3Key: string, pdfType: PdfType): Promise<Job> {
    // Increment counter
    this.jobsCounter.inc({ type: pdfType });
    
    // ... rest of implementation
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<Job> {
    if (status === JobStatus.COMPLETED) {
      const job = await this.getJobById(id);
      const duration = (Date.now() - job.createdAt.getTime()) / 1000;
      this.processingDuration.observe({ type: job.pdfType }, duration);
    }
    
    // ... rest of implementation
  }
}
```

#### Verification

```bash
# Check metrics endpoint
curl http://localhost:3001/metrics

# Should see metrics like:
# pdf_jobs_total{type="WEEKLY"} 150
# pdf_processing_duration_seconds_bucket{type="WEEKLY",le="10"} 120
```

---

## Phase 3: Load Testing

### 3.1 K6 Load Tests

Create load test scripts:

```javascript
// load-tests/upload.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
    http_req_failed: ['rate<0.05'],    // Less than 5% errors
  },
};

export default function () {
  const url = 'http://localhost:3001/api/upload';
  
  const fd = new FormData();
  fd.append('file', http.file(open('./test.pdf', 'b'), 'test.pdf'));
  
  const res = http.post(url, fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
  });
  
  check(res, {
    'status is 201': (r) => r.status === 201,
    'has jobId': (r) => JSON.parse(r.body).jobId !== undefined,
  });
  
  sleep(1);
}
```

Run tests:

```bash
k6 run load-tests/upload.js
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All Phase 1 critical fixes implemented
- [ ] Load tests passing with target user count
- [ ] Monitoring dashboards configured
- [ ] Backup strategy tested
- [ ] Rollback plan documented
- [ ] Team trained on new monitoring tools
- [ ] Incident response plan updated
- [ ] Performance baselines established

---

## Related Documents

- [Scalability Assessment](./SCALABILITY_ASSESSMENT.md)
- [Deployment Guide](../../DEPLOYMENT.md)
- [Architecture Overview](../architecture/overview.md)

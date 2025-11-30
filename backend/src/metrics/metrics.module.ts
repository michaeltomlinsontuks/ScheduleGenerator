import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service.js';

const pdfJobsTotalProvider = makeCounterProvider({
  name: 'pdf_jobs_total',
  help: 'Total number of PDF processing jobs created',
  labelNames: ['type'],
});

const pdfProcessingDurationProvider = makeHistogramProvider({
  name: 'pdf_processing_duration_seconds',
  help: 'Duration of PDF processing in seconds',
  labelNames: ['type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300], // Up to 5 minutes
});

const httpRequestDurationProvider = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

const databaseConnectionsProvider = makeGaugeProvider({
  name: 'database_connections',
  help: 'Number of database connections',
  labelNames: ['state'], // active, idle, total
});

const queueJobsWaitingProvider = makeGaugeProvider({
  name: 'queue_jobs_waiting',
  help: 'Number of jobs waiting in the queue',
  labelNames: ['queue'],
});

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    MetricsService,
    pdfJobsTotalProvider,
    pdfProcessingDurationProvider,
    httpRequestDurationProvider,
    databaseConnectionsProvider,
    queueJobsWaitingProvider,
  ],
  exports: [
    PrometheusModule,
    pdfJobsTotalProvider,
    pdfProcessingDurationProvider,
    httpRequestDurationProvider,
    databaseConnectionsProvider,
    queueJobsWaitingProvider,
  ],
})
export class MetricsModule {}

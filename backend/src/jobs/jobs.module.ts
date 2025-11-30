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
    }),
    StorageModule,
    forwardRef(() => ParserModule),
    forwardRef(() => import('../metrics/metrics.module.js').then(m => m.MetricsModule)),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsProcessor],
  exports: [JobsService, BullModule.registerQueue({ name: PDF_PROCESSING_QUEUE })],
})
export class JobsModule {}

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
    }),
    StorageModule,
    forwardRef(() => ParserModule),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsProcessor],
  exports: [JobsService, BullModule.registerQueue({ name: PDF_PROCESSING_QUEUE })],
})
export class JobsModule {}

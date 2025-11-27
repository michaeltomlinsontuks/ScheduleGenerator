import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { Job } from '../jobs/entities/job.entity.js';
import { StorageModule } from '../storage/storage.module.js';
import { JobsModule } from '../jobs/jobs.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    StorageModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}

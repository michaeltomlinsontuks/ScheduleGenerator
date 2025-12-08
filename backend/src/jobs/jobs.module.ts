import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';

@Module({
  imports: [],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule { }

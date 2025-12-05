import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { Job } from '../jobs/entities/job.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { ParserModule } from '../parser/parser.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, User]),
    ParserModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule { }

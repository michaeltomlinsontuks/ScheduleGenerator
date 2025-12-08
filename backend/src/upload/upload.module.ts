import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { ParserModule } from '../parser/parser.module.js';

@Module({
  imports: [
    ParserModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule { }

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ParserService } from './parser.service.js';
import { PARSER_SERVICE } from '../jobs/jobs.processor.js';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    ParserService,
    {
      provide: PARSER_SERVICE,
      useExisting: ParserService,
    },
  ],
  exports: [ParserService, PARSER_SERVICE],
})
export class ParserModule {}

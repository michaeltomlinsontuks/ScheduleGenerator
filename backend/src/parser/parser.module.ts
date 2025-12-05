import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ParserService } from './parser.service.js';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
  ],
  providers: [ParserService],
  exports: [ParserService],
})
export class ParserModule { }

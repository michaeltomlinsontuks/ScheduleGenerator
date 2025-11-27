import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PdfType, ParsedEvent } from '../jobs/entities/job.entity.js';
import { IParserService } from '../jobs/jobs.processor.js';
import FormData from 'form-data';

export interface ParserResponse {
  events: ParsedEvent[];
}

@Injectable()
export class ParserService implements IParserService {
  private readonly logger = new Logger(ParserService.name);
  private readonly parserUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.parserUrl =
      this.configService.get<string>('parser.url') ??
      'http://localhost:5000';
  }

  async parsePdf(pdfBuffer: Buffer, pdfType: PdfType): Promise<ParsedEvent[]> {
    this.logger.log(`Sending PDF to parser service, type: ${pdfType}`);

    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: 'schedule.pdf',
      contentType: 'application/pdf',
    });
    formData.append('type', pdfType);

    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(
          `${this.parserUrl}/parse`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 60000, // 60 second timeout for PDF parsing
          },
        ),
      );

      this.logger.log(
        `Parser returned ${response.data.events.length} events`,
      );
      
      // Transform Python worker response to match backend ParsedEvent interface
      const transformedEvents: ParsedEvent[] = response.data.events.map((event: any, index: number) => ({
        id: event.id || this.generateEventId(event, index),
        module: event.Module || event.module || '',
        activity: event.Activity || event.activity || '',
        group: event.Group || event.group,
        day: event.Day || event.day,
        date: event.Date || event.date,
        startTime: event.start_time || event.startTime || '',
        endTime: event.end_time || event.endTime || '',
        venue: event.Venue || event.venue || event.location || '',
        isRecurring: event.isRecurring !== undefined ? event.isRecurring : true,
      }));
      
      return transformedEvents;
    } catch (error) {
      this.logger.error(`Parser service error: ${error}`);
      throw new Error(
        `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
  
  /**
   * Generate a unique ID for an event based on its properties
   */
  private generateEventId(_event: any, _index: number): string {
    const crypto = require('crypto');
    
    // Generate a random UUID v4 for each event
    return crypto.randomUUID ? crypto.randomUUID() : this.generateUUIDv4();
  }
  
  /**
   * Generate a UUID v4 (fallback for older Node versions)
   */
  private generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

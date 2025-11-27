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
        this.httpService.post<ParserResponse>(
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
      return response.data.events;
    } catch (error) {
      this.logger.error(`Parser service error: ${error}`);
      throw new Error(
        `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

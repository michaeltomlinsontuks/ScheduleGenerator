import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { ParserService, ParserResponse } from './parser.service.js';
import { PdfType, ParsedEvent } from '../jobs/entities/job.entity.js';

describe('ParserService', () => {
  let service: ParserService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'parser.url') return 'http://localhost:5000';
      return undefined;
    }),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParserService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ParserService>(ParserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parsePdf', () => {
    const mockPdfBuffer = Buffer.from('mock pdf content');
    const mockParsedEvents: ParsedEvent[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        module: 'COS 132',
        activity: 'Lecture',
        day: 'Monday',
        startTime: '08:30',
        endTime: '09:20',
        venue: 'IT 4-1',
        isRecurring: true,
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        module: 'COS 132',
        activity: 'Tutorial',
        group: 'Group A',
        day: 'Wednesday',
        startTime: '14:30',
        endTime: '16:20',
        venue: 'IT 2-26',
        isRecurring: true,
      },
    ];

    it('should successfully parse a PDF and return events', async () => {
      const mockResponse: AxiosResponse<ParserResponse> = {
        data: { events: mockParsedEvents },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.parsePdf(mockPdfBuffer, PdfType.WEEKLY);

      expect(result).toEqual(mockParsedEvents);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:5000/parse',
        expect.any(Object), // FormData
        expect.objectContaining({
          timeout: 60000,
        }),
      );
    });

    it('should handle test schedule PDF type', async () => {
      const testEvents: ParsedEvent[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          module: 'COS 132',
          activity: 'Semester Test',
          date: '2025-03-15',
          startTime: '09:00',
          endTime: '11:00',
          venue: 'Exam Hall A',
          isRecurring: false,
        },
      ];

      const mockResponse: AxiosResponse<ParserResponse> = {
        data: { events: testEvents },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.parsePdf(mockPdfBuffer, PdfType.TEST);

      expect(result).toEqual(testEvents);
      expect(result[0].isRecurring).toBe(false);
    });

    it('should throw an error when parser service fails', async () => {
      const errorMessage = 'Parser service unavailable';
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      await expect(
        service.parsePdf(mockPdfBuffer, PdfType.WEEKLY),
      ).rejects.toThrow(`Failed to parse PDF: ${errorMessage}`);
    });

    it('should handle network errors gracefully', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => ({ code: 'ECONNREFUSED' })),
      );

      await expect(
        service.parsePdf(mockPdfBuffer, PdfType.WEEKLY),
      ).rejects.toThrow('Failed to parse PDF: Unknown error');
    });

    it('should return empty array when parser returns no events', async () => {
      const mockResponse: AxiosResponse<ParserResponse> = {
        data: { events: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.parsePdf(mockPdfBuffer, PdfType.WEEKLY);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });
});

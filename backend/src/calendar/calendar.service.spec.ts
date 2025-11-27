import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { GoogleCalendarService } from './calendar.service.js';
import { EventConfigDto } from './dto/event-config.dto.js';

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  let httpService: HttpService;

  const mockAccessToken = 'mock-access-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleCalendarService>(GoogleCalendarService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('listCalendars', () => {
    it('should return list of calendars', async () => {
      const mockCalendars = {
        items: [
          { id: 'cal1', summary: 'Primary', primary: true },
          { id: 'cal2', summary: 'Work', description: 'Work calendar' },
        ],
      };

      const mockResponse: AxiosResponse = {
        data: mockCalendars,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.listCalendars(mockAccessToken);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'cal1',
        summary: 'Primary',
        primary: true,
        description: undefined,
        backgroundColor: undefined,
      });
    });


    it('should throw HttpException on API error', async () => {
      const error = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => error));

      await expect(service.listCalendars(mockAccessToken)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('createCalendar', () => {
    it('should create a new calendar', async () => {
      const mockCalendar = {
        id: 'new-cal-id',
        summary: 'UP Schedule',
        description: 'My university schedule',
      };

      const mockResponse: AxiosResponse = {
        data: mockCalendar,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.createCalendar(
        mockAccessToken,
        'UP Schedule',
        'My university schedule',
      );

      expect(result).toEqual({
        id: 'new-cal-id',
        summary: 'UP Schedule',
        description: 'My university schedule',
      });
    });

    it('should throw HttpException on API error', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => error));

      await expect(
        service.createCalendar(mockAccessToken, 'Test Calendar'),
      ).rejects.toThrow(HttpException);
    });
  });


  describe('addEvents', () => {
    const mockEvent: EventConfigDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      summary: 'COS 132 Lecture',
      location: 'IT Building 4-1',
      startTime: '08:30',
      endTime: '09:20',
      day: 'Monday',
      isRecurring: true,
      colorId: '1',
    };

    const mockSingleEvent: EventConfigDto = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      summary: 'COS 132 Test',
      location: 'Exam Hall',
      startTime: '14:00',
      endTime: '17:00',
      date: '2025-05-15',
      isRecurring: false,
      colorId: '2',
    };

    it('should add recurring events to calendar', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: 'event-id' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      await expect(
        service.addEvents(
          mockAccessToken,
          'primary',
          [mockEvent],
          '2025-02-10',
          '2025-06-06',
        ),
      ).resolves.not.toThrow();

      expect(httpService.post).toHaveBeenCalled();
    });

    it('should add single events to calendar', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: 'event-id' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      await expect(
        service.addEvents(
          mockAccessToken,
          'primary',
          [mockSingleEvent],
          '2025-02-10',
          '2025-06-06',
        ),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException on API error', async () => {
      const error = {
        response: {
          status: 403,
          data: { error: 'Forbidden' },
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => error));

      await expect(
        service.addEvents(
          mockAccessToken,
          'primary',
          [mockEvent],
          '2025-02-10',
          '2025-06-06',
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('error handling', () => {
    it('should return 401 message for authentication errors', async () => {
      const error = {
        response: {
          status: 401,
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => error));

      try {
        await service.listCalendars(mockAccessToken);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should handle errors without response object', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('Network error')));

      try {
        await service.listCalendars(mockAccessToken);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  });
});

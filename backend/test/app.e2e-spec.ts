import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { IcsService } from '../src/calendar/ics.service';

/**
 * E2E Tests for UP Schedule Generator Backend
 * Tests critical paths: ICS generation, health check, and API structure
 * 
 * Note: Upload and job tests require external services (MinIO, PostgreSQL, Redis)
 * and are tested separately in integration tests with docker-compose
 */
describe('UP Schedule Generator Backend (e2e)', () => {
  let app: INestApplication<App>;
  let icsService: IcsService;

  beforeAll(async () => {
    // Create a minimal test module for E2E testing without external dependencies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              port: 3001,
              frontend: { url: 'http://localhost:3000' },
            }),
          ],
        }),
      ],
      providers: [IcsService],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global pipes and filters as in main.ts
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    icsService = moduleFixture.get<IcsService>(IcsService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('ICS Generation', () => {
    it('should generate valid ICS content for recurring events', () => {
      const events = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          summary: 'COS 132 - Lecture',
          location: 'IT Building 4-1',
          startTime: '08:30',
          endTime: '09:20',
          day: 'Monday',
          isRecurring: true,
          colorId: '1',
        },
      ];

      const icsContent = icsService.generateIcs(
        events,
        '2025-02-10',
        '2025-06-06',
      );

      // Verify ICS structure
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).toContain('VERSION:2.0');
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');
      
      // Verify recurring event has RRULE
      expect(icsContent).toContain('RRULE:FREQ=WEEKLY');
      expect(icsContent).toContain('BYDAY=MO');
      expect(icsContent).toContain('UNTIL=20250606');
      
      // Verify event details
      expect(icsContent).toContain('SUMMARY:COS 132 - Lecture');
      expect(icsContent).toContain('LOCATION:IT Building 4-1');
    });

    it('should generate valid ICS content for single events', () => {
      const events = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          summary: 'COS 132 - Semester Test 1',
          location: 'Exam Hall A',
          startTime: '14:00',
          endTime: '16:00',
          date: '2025-03-15',
          isRecurring: false,
          colorId: '2',
        },
      ];

      const icsContent = icsService.generateIcs(
        events,
        '2025-02-10',
        '2025-06-06',
      );

      // Verify ICS structure
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');
      
      // Verify single event does NOT have RRULE
      expect(icsContent).not.toContain('RRULE');
      
      // Verify event details
      expect(icsContent).toContain('SUMMARY:COS 132 - Semester Test 1');
      expect(icsContent).toContain('LOCATION:Exam Hall A');
      expect(icsContent).toContain('20250315T140000');
    });

    it('should generate ICS with multiple events', () => {
      const events = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          summary: 'COS 132 - Lecture',
          location: 'IT Building 4-1',
          startTime: '08:30',
          endTime: '09:20',
          day: 'Monday',
          isRecurring: true,
          colorId: '1',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          summary: 'COS 132 - Tutorial',
          location: 'IT Building 2-3',
          startTime: '10:30',
          endTime: '11:20',
          day: 'Wednesday',
          isRecurring: true,
          colorId: '1',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          summary: 'COS 132 - Semester Test',
          location: 'Exam Hall',
          startTime: '14:00',
          endTime: '16:00',
          date: '2025-04-10',
          isRecurring: false,
          colorId: '2',
        },
      ];

      const icsContent = icsService.generateIcs(
        events,
        '2025-02-10',
        '2025-06-06',
      );

      // Count VEVENT occurrences
      const veventCount = (icsContent.match(/BEGIN:VEVENT/g) || []).length;
      expect(veventCount).toBe(3);

      // Verify all events are present
      expect(icsContent).toContain('COS 132 - Lecture');
      expect(icsContent).toContain('COS 132 - Tutorial');
      expect(icsContent).toContain('COS 132 - Semester Test');
    });

    it('should escape special characters in ICS content', () => {
      const events = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          summary: 'Event with, comma; semicolon',
          location: 'Room\\Floor',
          startTime: '08:30',
          endTime: '09:20',
          date: '2025-03-15',
          isRecurring: false,
          colorId: '1',
        },
      ];

      const icsContent = icsService.generateIcs(
        events,
        '2025-02-10',
        '2025-06-06',
      );

      // Verify special characters are escaped
      expect(icsContent).toContain('Event with\\, comma\\; semicolon');
      expect(icsContent).toContain('Room\\\\Floor');
    });
  });

  describe('ICS Service - Day Mapping', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayCodes = ['MO', 'TU', 'WE', 'TH', 'FR'];

    days.forEach((day, index) => {
      it(`should map ${day} to ${dayCodes[index]}`, () => {
        const events = [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            summary: 'Test Event',
            location: 'Test Location',
            startTime: '08:30',
            endTime: '09:20',
            day: day,
            isRecurring: true,
            colorId: '1',
          },
        ];

        const icsContent = icsService.generateIcs(
          events,
          '2025-02-10',
          '2025-06-06',
        );

        expect(icsContent).toContain(`BYDAY=${dayCodes[index]}`);
      });
    });
  });
});

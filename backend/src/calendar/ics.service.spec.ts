import * as fc from 'fast-check';
import { IcsService } from './ics.service.js';
import { EventConfigDto } from './dto/event-config.dto.js';

describe('IcsService', () => {
  let service: IcsService;

  beforeEach(() => {
    service = new IcsService();
  });

  // Arbitrary for generating valid time strings (HH:MM)
  const timeArb = fc
    .tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
    .map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

  // Arbitrary for generating valid day names
  const dayArb = fc.constantFrom(
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  );

  // Arbitrary for generating valid ISO date strings
  const dateArb = fc
    .tuple(
      fc.integer({ min: 2020, max: 2028 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }),
    )
    .map(([year, month, day]) => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    );

  // Arbitrary for generating valid UUIDs
  const uuidArb = fc.uuid();

  // Arbitrary for generating safe text (no special ICS characters that would break parsing)
  const safeTextArb = fc.string({ minLength: 1, maxLength: 50 }).filter(
    (s) => s.trim().length > 0 && !s.includes('\r') && !s.includes('\n'),
  );

  // Arbitrary for generating recurring events
  const recurringEventArb: fc.Arbitrary<EventConfigDto> = fc.record({
    id: uuidArb,
    summary: safeTextArb,
    location: safeTextArb,
    startTime: timeArb,
    endTime: timeArb,
    day: dayArb,
    date: fc.constant(undefined),
    isRecurring: fc.constant(true),
    colorId: fc.constantFrom('1', '2', '3', '4', '5'),
  }) as fc.Arbitrary<EventConfigDto>;


  // Arbitrary for generating single (non-recurring) events
  const singleEventArb: fc.Arbitrary<EventConfigDto> = fc.record({
    id: uuidArb,
    summary: safeTextArb,
    location: safeTextArb,
    startTime: timeArb,
    endTime: timeArb,
    day: fc.constant(undefined),
    date: dateArb,
    isRecurring: fc.constant(false),
    colorId: fc.constantFrom('1', '2', '3', '4', '5'),
  }) as fc.Arbitrary<EventConfigDto>;

  // Arbitrary for generating semester date ranges
  const semesterDatesArb = fc
    .tuple(
      fc.integer({ min: 2020, max: 2028 }),
      fc.integer({ min: 1, max: 6 }),
      fc.integer({ min: 1, max: 28 }),
      fc.integer({ min: 60, max: 180 }),
    )
    .map(([year, month, day, days]) => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + days);
      const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      return {
        semesterStart: startDate,
        semesterEnd: endDate,
      };
    });

  describe('Property 15: ICS Generation Validity', () => {
    /**
     * **Feature: backend-implementation, Property 15: ICS Generation Validity**
     * *For any* array of EventConfigDto objects, the generated ICS string SHALL be
     * parseable as valid iCalendar format and contain exactly one VEVENT for each
     * non-recurring event and one VEVENT with RRULE for each recurring event.
     * **Validates: Requirements 7.1, 7.2, 7.3**
     */
    it('should generate valid ICS with correct number of VEVENTs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(recurringEventArb, singleEventArb), { minLength: 0, maxLength: 10 }),
          semesterDatesArb,
          (events, { semesterStart, semesterEnd }) => {
            const ics = service.generateIcs(events, semesterStart, semesterEnd);

            // Check basic ICS structure
            expect(ics).toContain('BEGIN:VCALENDAR');
            expect(ics).toContain('END:VCALENDAR');
            expect(ics).toContain('VERSION:2.0');
            expect(ics).toContain('PRODID:');

            // Count VEVENTs
            const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
            expect(veventCount).toBe(events.length);

            // Each VEVENT should have matching END:VEVENT
            const endVeventCount = (ics.match(/END:VEVENT/g) || []).length;
            expect(endVeventCount).toBe(events.length);

            // Each event should have required fields
            events.forEach((event) => {
              expect(ics).toContain(`UID:${event.id}@upschedulegen`);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });


  describe('Property 16: ICS Recurring Event RRULE', () => {
    /**
     * **Feature: backend-implementation, Property 16: ICS Recurring Event RRULE**
     * *For any* EventConfigDto with isRecurring=true, the generated VEVENT SHALL
     * contain an RRULE with FREQ=WEEKLY and UNTIL set to the semester end date.
     * **Validates: Requirements 7.2**
     */
    it('should include RRULE with FREQ=WEEKLY for recurring events', () => {
      fc.assert(
        fc.property(
          recurringEventArb,
          semesterDatesArb,
          (event, { semesterStart, semesterEnd }) => {
            const ics = service.generateIcs([event], semesterStart, semesterEnd);

            // Should contain RRULE
            expect(ics).toContain('RRULE:');

            // Should have FREQ=WEEKLY
            expect(ics).toContain('FREQ=WEEKLY');

            // Should have BYDAY with correct day code
            const dayMap: Record<string, string> = {
              monday: 'MO',
              tuesday: 'TU',
              wednesday: 'WE',
              thursday: 'TH',
              friday: 'FR',
              saturday: 'SA',
              sunday: 'SU',
            };
            const expectedDayCode = dayMap[event.day!.toLowerCase()];
            expect(ics).toContain(`BYDAY=${expectedDayCode}`);

            // Should have UNTIL with semester end date
            const endDate = new Date(semesterEnd);
            const expectedUntil = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
            expect(ics).toContain(`UNTIL=${expectedUntil}`);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 17: ICS Single Event No RRULE', () => {
    /**
     * **Feature: backend-implementation, Property 17: ICS Single Event No RRULE**
     * *For any* EventConfigDto with isRecurring=false, the generated VEVENT SHALL
     * NOT contain an RRULE property.
     * **Validates: Requirements 7.3**
     */
    it('should not include RRULE for single events', () => {
      fc.assert(
        fc.property(
          singleEventArb,
          semesterDatesArb,
          (event, { semesterStart, semesterEnd }) => {
            const ics = service.generateIcs([event], semesterStart, semesterEnd);

            // Should contain VEVENT
            expect(ics).toContain('BEGIN:VEVENT');
            expect(ics).toContain('END:VEVENT');

            // Should NOT contain RRULE
            expect(ics).not.toContain('RRULE:');

            // Should contain the event summary and location
            // Note: ICS escapes special characters, so we check for the UID instead
            expect(ics).toContain(`UID:${event.id}@upschedulegen`);
          },
        ),
        { numRuns: 100 },
      );
    });
  });


  describe('Unit tests for IcsService', () => {
    it('should generate ICS for empty events array', () => {
      const ics = service.generateIcs([], '2025-02-10', '2025-06-06');

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).not.toContain('BEGIN:VEVENT');
    });

    it('should escape special characters in summary and location', () => {
      const event: EventConfigDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        summary: 'Test; Event, with special chars',
        location: 'Room; 101, Building A',
        startTime: '08:30',
        endTime: '09:20',
        date: '2025-05-15',
        isRecurring: false,
        colorId: '1',
      };

      const ics = service.generateIcs([event], '2025-02-10', '2025-06-06');

      // Special characters should be escaped
      expect(ics).toContain('SUMMARY:Test\\; Event\\, with special chars');
      expect(ics).toContain('LOCATION:Room\\; 101\\, Building A');
    });

    it('should format datetime correctly', () => {
      const event: EventConfigDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        summary: 'Test Event',
        location: 'Room 101',
        startTime: '08:30',
        endTime: '09:20',
        day: 'Monday',
        isRecurring: true,
        colorId: '1',
      };

      const ics = service.generateIcs([event], '2025-02-10', '2025-06-06');

      // Should contain properly formatted DTSTART and DTEND
      expect(ics).toMatch(/DTSTART:\d{8}T083000/);
      expect(ics).toMatch(/DTEND:\d{8}T092000/);
    });
  });
});

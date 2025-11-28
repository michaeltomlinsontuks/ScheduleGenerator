import { Injectable } from '@nestjs/common';
import { EventConfigDto } from './dto/event-config.dto.js';

/**
 * Day name to iCalendar day code mapping
 */
const DAY_MAP: Record<string, string> = {
  monday: 'MO',
  tuesday: 'TU',
  wednesday: 'WE',
  thursday: 'TH',
  friday: 'FR',
  saturday: 'SA',
  sunday: 'SU',
};

/**
 * Day name to JavaScript day number (0 = Sunday)
 */
const DAY_NUMBER_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

@Injectable()
export class IcsService {
  /**
   * Generates a complete ICS file content from an array of events
   * @param events - Array of event configurations
   * @param semesterStart - ISO date string for semester start (optional for test/exam modes)
   * @param semesterEnd - ISO date string for semester end (optional for test/exam modes)
   * @returns Valid ICS file content as string
   */
  generateIcs(
    events: EventConfigDto[],
    semesterStart?: string,
    semesterEnd?: string,
  ): string {
    const vevents = events
      .map((event) => {
        if (event.isRecurring) {
          // Recurring events require semester dates
          if (!semesterStart || !semesterEnd) {
            throw new Error('Semester start and end dates are required for recurring events');
          }
          return this.createRecurringEvent(event, semesterStart, semesterEnd);
        } else {
          return this.createSingleEvent(event);
        }
      })
      .join('\r\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UP Schedule Generator//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      vevents,
      'END:VCALENDAR',
    ].join('\r\n');
  }


  /**
   * Creates a recurring VEVENT with RRULE for weekly events
   * @param event - Event configuration
   * @param semesterStart - ISO date string for semester start
   * @param semesterEnd - ISO date string for semester end
   * @returns VEVENT string with RRULE
   */
  createRecurringEvent(
    event: EventConfigDto,
    semesterStart: string,
    semesterEnd: string,
  ): string {
    const startDate = this.getFirstOccurrence(event.day!, semesterStart);
    const dtstart = this.formatDateTime(startDate, event.startTime);
    const dtend = this.formatDateTime(startDate, event.endTime);
    const until = this.formatDateOnly(semesterEnd);
    const dayCode = DAY_MAP[event.day!.toLowerCase()] || 'MO';

    return [
      'BEGIN:VEVENT',
      `UID:${event.id}@upschedulegen`,
      `DTSTAMP:${this.formatNow()}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${until}`,
      `SUMMARY:${this.escapeText(event.summary)}`,
      `LOCATION:${this.escapeText(event.location)}`,
      'END:VEVENT',
    ].join('\r\n');
  }

  /**
   * Creates a single-occurrence VEVENT without RRULE
   * @param event - Event configuration
   * @returns VEVENT string without RRULE
   */
  createSingleEvent(event: EventConfigDto): string {
    const eventDate = new Date(event.date!);
    const dtstart = this.formatDateTime(eventDate, event.startTime);
    const dtend = this.formatDateTime(eventDate, event.endTime);

    const veventLines = [
      'BEGIN:VEVENT',
      `UID:${event.id}@upschedulegen`,
      `DTSTAMP:${this.formatNow()}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${this.escapeText(event.summary)}`,
      `LOCATION:${this.escapeText(event.location)}`,
    ];

    // Add notes/description if present (for unfinalised exams)
    if (event.notes) {
      veventLines.push(`DESCRIPTION:${this.escapeText(event.notes)}`);
    }

    veventLines.push('END:VEVENT');

    return veventLines.join('\r\n');
  }

  /**
   * Gets the first occurrence date for a recurring event
   * @param dayName - Day of the week (e.g., "Monday")
   * @param semesterStart - ISO date string for semester start
   * @returns Date of first occurrence
   */
  private getFirstOccurrence(dayName: string, semesterStart: string): Date {
    const start = new Date(semesterStart);
    const targetDay = DAY_NUMBER_MAP[dayName.toLowerCase()] ?? 1;
    const currentDay = start.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    
    const firstOccurrence = new Date(start);
    firstOccurrence.setDate(start.getDate() + daysUntilTarget);
    return firstOccurrence;
  }

  /**
   * Formats a date and time into iCalendar datetime format
   * @param date - The date
   * @param time - Time in HH:MM format
   * @returns Formatted datetime string (YYYYMMDDTHHMMSS)
   */
  private formatDateTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    return `${year}${month}${day}T${h}${m}00`;
  }

  /**
   * Formats a date into iCalendar date-only format for UNTIL
   * @param isoDate - ISO date string
   * @returns Formatted date string (YYYYMMDD)
   */
  private formatDateOnly(isoDate: string): string {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Formats current timestamp for DTSTAMP
   * @returns Current datetime in iCalendar format
   */
  private formatNow(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Escapes special characters in text for ICS format
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
}

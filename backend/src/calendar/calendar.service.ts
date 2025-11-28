import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CalendarDto } from './dto/calendar-list.dto.js';
import { EventConfigDto } from './dto/event-config.dto.js';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Day name to iCalendar day code mapping for RRULE
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

interface GoogleCalendarListResponse {
  items: Array<{
    id: string;
    summary: string;
    description?: string;
    primary?: boolean;
    backgroundColor?: string;
  }>;
}

interface GoogleCalendarResponse {
  id: string;
  summary: string;
  description?: string;
}


@Injectable()
export class GoogleCalendarService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Lists all calendars for the authenticated user
   * @param accessToken - Google OAuth access token
   * @returns Array of calendar objects
   */
  async listCalendars(accessToken: string): Promise<CalendarDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<GoogleCalendarListResponse>(
          `${GOOGLE_CALENDAR_API}/users/me/calendarList`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return response.data.items.map((item) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        primary: item.primary,
        backgroundColor: item.backgroundColor,
      }));
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }

  /**
   * Creates a new Google Calendar
   * @param accessToken - Google OAuth access token
   * @param name - Name for the new calendar
   * @param description - Optional description
   * @returns Created calendar object
   */
  async createCalendar(
    accessToken: string,
    name: string,
    description?: string,
  ): Promise<CalendarDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GoogleCalendarResponse>(
          `${GOOGLE_CALENDAR_API}/calendars`,
          {
            summary: name,
            description,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        id: response.data.id,
        summary: response.data.summary,
        description: response.data.description,
      };
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }


  /**
   * Adds events to a Google Calendar
   * @param accessToken - Google OAuth access token
   * @param calendarId - Target calendar ID
   * @param events - Array of events to add
   * @param semesterStart - Semester start date (ISO string, optional for test/exam modes)
   * @param semesterEnd - Semester end date (ISO string, optional for test/exam modes)
   */
  async addEvents(
    accessToken: string,
    calendarId: string,
    events: EventConfigDto[],
    semesterStart?: string,
    semesterEnd?: string,
  ): Promise<void> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Process events in batches to avoid rate limiting
    for (const event of events) {
      try {
        const googleEvent = this.convertToGoogleEvent(
          event,
          semesterStart,
          semesterEnd,
        );

        await firstValueFrom(
          this.httpService.post(
            `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
            googleEvent,
            { headers },
          ),
        );
      } catch (error) {
        this.handleGoogleApiError(error);
      }
    }
  }

  /**
   * Converts an EventConfigDto to Google Calendar event format
   */
  private convertToGoogleEvent(
    event: EventConfigDto,
    semesterStart?: string,
    semesterEnd?: string,
  ): object {
    if (event.isRecurring) {
      if (!semesterStart || !semesterEnd) {
        throw new Error('Semester start and end dates are required for recurring events');
      }
      return this.createRecurringGoogleEvent(event, semesterStart, semesterEnd);
    }
    return this.createSingleGoogleEvent(event);
  }

  /**
   * Creates a recurring Google Calendar event
   */
  private createRecurringGoogleEvent(
    event: EventConfigDto,
    semesterStart: string,
    semesterEnd: string,
  ): object {
    const startDate = this.getFirstOccurrence(event.day!, semesterStart);
    const endDate = new Date(startDate);
    
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    
    startDate.setHours(startHours, startMinutes, 0, 0);
    endDate.setHours(endHours, endMinutes, 0, 0);

    const dayCode = DAY_MAP[event.day!.toLowerCase()] || 'MO';
    const untilDate = new Date(semesterEnd);
    const until = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return {
      summary: event.summary,
      location: event.location,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Africa/Johannesburg',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Africa/Johannesburg',
      },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${until}`],
      colorId: event.colorId,
    };
  }


  /**
   * Creates a single (non-recurring) Google Calendar event
   */
  private createSingleGoogleEvent(event: EventConfigDto): object {
    const eventDate = new Date(event.date!);
    const startDate = new Date(eventDate);
    const endDate = new Date(eventDate);

    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);

    startDate.setHours(startHours, startMinutes, 0, 0);
    endDate.setHours(endHours, endMinutes, 0, 0);

    const googleEvent: Record<string, unknown> = {
      summary: event.summary,
      location: event.location,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Africa/Johannesburg',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Africa/Johannesburg',
      },
      colorId: event.colorId,
    };

    // Add description/notes if present (for unfinalised exams)
    if (event.notes) {
      googleEvent.description = event.notes;
    }

    return googleEvent;
  }

  /**
   * Gets the first occurrence date for a recurring event
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
   * Handles Google API errors and throws appropriate HTTP exceptions
   */
  private handleGoogleApiError(error: unknown): never {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        status === 401
          ? 'Google authentication expired. Please re-authenticate.'
          : 'Google Calendar API error';

      throw new HttpException(
        {
          statusCode: status,
          message,
          error: 'CALENDAR_API_ERROR',
        },
        status,
      );
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Google Calendar API error',
        error: 'CALENDAR_API_ERROR',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

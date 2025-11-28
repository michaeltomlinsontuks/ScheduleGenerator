import { api } from './api';

/**
 * Google Calendar information
 */
export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
}

/**
 * Calendar list response
 */
export interface CalendarListResponse {
  calendars: Calendar[];
}

/**
 * Event configuration for calendar operations
 */
export interface EventConfig {
  id: string;
  summary: string;
  location: string;
  startTime: string;
  endTime: string;
  day?: string;
  date?: string;
  isRecurring: boolean;
  colorId: string;
  notes?: string;
}

/**
 * PDF mode type
 */
export type PdfType = 'lecture' | 'test' | 'exam';

/**
 * Request payload for ICS file generation
 */
export interface GenerateIcsRequest {
  events: EventConfig[];
  semesterStart?: string;
  semesterEnd?: string;
  pdfType?: PdfType;
}

/**
 * Request payload for adding events to Google Calendar
 */
export interface AddEventsRequest extends GenerateIcsRequest {
  calendarId: string;
}

/**
 * Response from adding events to calendar
 */
export interface AddEventsResponse {
  message: string;
  count: number;
}

/**
 * Calendar service for Google Calendar operations
 */
export const calendarService = {
  /**
   * List all calendars for the authenticated user
   */
  listCalendars: () => api.get<CalendarListResponse>('/api/calendars'),

  /**
   * Create a new calendar
   * @param name - Name for the new calendar
   * @param description - Optional description
   */
  createCalendar: (name: string, description?: string) =>
    api.post<Calendar>('/api/calendars', { name, description }),

  /**
   * Add events to a Google Calendar
   * @param request - Events and calendar configuration
   */
  addEvents: (request: AddEventsRequest) =>
    api.post<AddEventsResponse>('/api/calendars/events', request),

  /**
   * Generate an ICS file for download
   * @param request - Events and date range configuration
   */
  generateIcs: (request: GenerateIcsRequest) =>
    api.post('/api/generate/ics', request, { responseType: 'blob' }),
};

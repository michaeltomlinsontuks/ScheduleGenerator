/**
 * Event Mapper Utility
 * Maps ParsedEvent array to EventConfig array for API requests
 * Requirements: 5.1, 6.1
 */
import type { ParsedEvent } from '@/types';
import type { EventConfig } from '@/services/calendarService';

/**
 * Capitalize the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Check if an event is unfinalised (has TBA or Unfinalised text)
 */
function isUnfinalised(event: ParsedEvent): boolean {
  const venue = event.venue?.toLowerCase() || '';
  const date = event.date?.toLowerCase() || '';
  return venue.includes('tba') || 
         venue.includes('unfinalised') || 
         date.includes('tba') || 
         date.includes('unfinalised');
}

/**
 * Map a single ParsedEvent to EventConfig format
 * @param event - The parsed event from PDF processing
 * @param moduleColors - Record of module codes to color IDs
 * @returns EventConfig formatted for API requests
 */
export function mapEventToConfig(
  event: ParsedEvent,
  moduleColors: Record<string, string>
): EventConfig {
  const config: EventConfig = {
    id: event.id,
    summary: `${event.module} ${event.activity}`,
    location: event.venue || '',
    startTime: event.startTime,
    endTime: event.endTime,
    day: event.day,
    date: event.date,
    isRecurring: event.isRecurring,
    colorId: moduleColors[event.module] || '1',
  };

  // Add notes for unfinalised exams
  if (isUnfinalised(event)) {
    config.notes = 'This exam schedule is unfinalised. Date, time, or venue may change. Please check the official schedule regularly for updates.';
  }

  return config;
}

/**
 * Map an array of ParsedEvents to EventConfig array
 * @param events - Array of parsed events from PDF processing
 * @param moduleColors - Record of module codes to color IDs
 * @returns Array of EventConfig objects formatted for API requests
 */
export function mapEventsToConfig(
  events: ParsedEvent[],
  moduleColors: Record<string, string>
): EventConfig[] {
  return events.map((event) => mapEventToConfig(event, moduleColors));
}

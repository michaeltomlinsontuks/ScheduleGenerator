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
 * Map a single ParsedEvent to EventConfig format
 * @param event - The parsed event from PDF processing
 * @param moduleColors - Record of module codes to color IDs
 * @returns EventConfig formatted for API requests
 */
export function mapEventToConfig(
  event: ParsedEvent,
  moduleColors: Record<string, string>
): EventConfig {
  return {
    id: event.id,
    summary: `${event.moduleCode} - ${capitalize(event.eventType)}`,
    location: event.location || '',
    startTime: event.startTime,
    endTime: event.endTime,
    day: event.dayOfWeek,
    isRecurring: true,
    colorId: moduleColors[event.moduleCode] || '1',
  };
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

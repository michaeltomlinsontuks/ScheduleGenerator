'use client';

import type { ParsedEvent } from '@/types';
import { EventCard } from './EventCard';

export interface EventListProps {
  events: ParsedEvent[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  filterModule?: string;
  moduleColors?: Record<string, string>;
}

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

const DAYS_ORDER: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Groups events by day of week
 */
function groupEventsByDay(events: ParsedEvent[]): Record<DayOfWeek, ParsedEvent[]> {
  const grouped: Record<DayOfWeek, ParsedEvent[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  };

  for (const event of events) {
    if (event.day && event.day in grouped) {
      grouped[event.day as DayOfWeek].push(event);
    }
  }

  // Sort events within each day by start time
  for (const day of DAYS_ORDER) {
    grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return grouped;
}

/**
 * EventList - Groups and displays events by day of week
 * Requirements: 6.3
 */
export function EventList({
  events,
  selectedIds,
  onToggle,
  filterModule,
  moduleColors = {},
}: EventListProps) {
  // Filter events by module if specified
  const filteredEvents = filterModule && filterModule !== 'all'
    ? events.filter((e) => e.module === filterModule)
    : events;

  const groupedEvents = groupEventsByDay(filteredEvents);

  // Get color hex for a module
  const getColorHex = (moduleCode: string): string | undefined => {
    const colorId = moduleColors[moduleCode];
    if (!colorId) return undefined;
    // Import colors utility inline to get hex
    const colors: Record<string, string> = {
      '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
      '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161',
      '9': '#3f51b5', '10': '#0b8043', '11': '#d50000',
    };
    return colors[colorId];
  };

  return (
    <div className="space-y-6">
      {DAYS_ORDER.map((day) => {
        const dayEvents = groupedEvents[day];
        if (dayEvents.length === 0) return null;

        return (
          <div key={day}>
            <h3 className="text-lg font-semibold text-base-content mb-3">
              {day}
              <span className="text-sm font-normal text-base-content/60 ml-2">
                ({dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''})
              </span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  selected={selectedIds.has(event.id)}
                  onToggle={() => onToggle(event.id)}
                  colorHex={getColorHex(event.module)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-base-content/60">
          No events found{filterModule && filterModule !== 'all' ? ` for ${filterModule}` : ''}.
        </div>
      )}
    </div>
  );
}

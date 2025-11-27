'use client';

import type { ParsedEvent } from '@/types';

export interface EventCardProps {
  event: ParsedEvent;
  selected: boolean;
  onToggle: () => void;
  colorHex?: string;
}

/**
 * EventCard - Displays a single event with selection checkbox
 * Requirements: 6.4, 6.5
 */
export function EventCard({ event, selected, onToggle, colorHex }: EventCardProps) {
  const timeRange = `${event.startTime} - ${event.endTime}`;
  
  // Format event type for display (capitalize first letter)
  const eventTypeDisplay = event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1);

  return (
    <div 
      className="card card-border bg-base-100 shadow-sm hover:shadow-md transition-shadow"
      style={colorHex ? { borderLeftColor: colorHex, borderLeftWidth: '4px' } : undefined}
    >
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          <input
            type="checkbox"
            className="checkbox checkbox-primary mt-1"
            checked={selected}
            onChange={onToggle}
            aria-label={`Select ${event.moduleCode} ${eventTypeDisplay}`}
          />
          
          <div className="flex-1 min-w-0">
            {/* Module code and event type */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base-content">
                {event.moduleCode}
              </span>
              <span className="badge badge-outline badge-sm">
                {eventTypeDisplay}
              </span>
              {event.group && (
                <span className="badge badge-ghost badge-sm">
                  {event.group}
                </span>
              )}
            </div>
            
            {/* Time range */}
            <div className="text-sm text-base-content/70 mt-1">
              {timeRange}
            </div>
            
            {/* Location */}
            {event.location && (
              <div className="text-sm text-base-content/60 mt-0.5">
                📍 {event.location}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

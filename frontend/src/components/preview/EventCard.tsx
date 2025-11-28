'use client';

import type { ParsedEvent } from '@/types';
import { Alert } from '@/components/common';

export interface EventCardProps {
  event: ParsedEvent;
  selected: boolean;
  onToggle: () => void;
  colorHex?: string;
  pdfType?: 'lecture' | 'test' | 'exam';
}

/**
 * EventCard - Displays a single event with selection checkbox
 * Requirements: 6.4, 6.5, 3.1
 */
export function EventCard({ event, selected, onToggle, colorHex, pdfType }: EventCardProps) {
  const timeRange = `${event.startTime} - ${event.endTime}`;
  
  // Format event type for display (capitalize first letter)
  const eventTypeDisplay = event.activity.charAt(0).toUpperCase() + event.activity.slice(1);

  // Detect unfinalised exams - check venue and date fields for "Unfinalised" or "TBA" text
  const venue = event.venue || '';
  const date = event.date || '';
  
  const isUnfinalised = 
    venue.toLowerCase().includes('unfinalised') ||
    venue.toLowerCase().includes('tba') ||
    date.toLowerCase().includes('unfinalised') ||
    date.toLowerCase().includes('tba');

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
            aria-label={`Select ${event.module} ${eventTypeDisplay}`}
          />
          
          <div className="flex-1 min-w-0">
            {/* Module code and event type */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base-content">
                {event.module}
              </span>
              <span className="badge badge-outline badge-sm">
                {eventTypeDisplay}
              </span>
              {event.group && (
                <span className="badge badge-ghost badge-sm">
                  {event.group}
                </span>
              )}
              {/* Warning badge for unfinalised exams */}
              {isUnfinalised && pdfType === 'exam' && (
                <span className="badge badge-warning badge-sm">
                  ⚠️ Unfinalised
                </span>
              )}
            </div>
            
            {/* Time range */}
            <div className="text-sm text-base-content/70 mt-1">
              {timeRange}
            </div>
            
            {/* Location */}
            {event.venue && (
              <div className="text-sm text-base-content/60 mt-0.5">
                📍 {event.venue}
              </div>
            )}
            
            {/* Alert for unfinalised exams */}
            {isUnfinalised && (
              <div className="mt-2">
                <Alert 
                  type="warning" 
                  message="This exam schedule is not yet finalised. Check for updates closer to the exam period."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

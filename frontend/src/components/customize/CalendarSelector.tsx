'use client';

import { useState, useRef, useEffect } from 'react';
import type { Calendar } from '@/services/calendarService';
import { Button } from '@/components/common/Button';

export interface CalendarSelectorProps {
  calendars: Calendar[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

/**
 * Calendar selector dropdown with option to create new calendar
 * Requirements: 4.2, 4.3, 4.4
 */
export function CalendarSelector({
  calendars,
  selectedId,
  onSelect,
  onCreate,
  isLoading,
  error,
}: CalendarSelectorProps) {
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCalendar = calendars.find((c) => c.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
        setShowCreateInput(false);
        setNewCalendarName('');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Focus input when showing create form
  useEffect(() => {
    if (showCreateInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateInput]);

  const handleSelect = (id: string) => {
    onSelect(id);
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(newCalendarName.trim());
      setNewCalendarName('');
      setShowCreateInput(false);
      if (detailsRef.current) {
        detailsRef.current.open = false;
      }
    } catch {
      // Error is already set in useCalendars hook and displayed to user
      // We just need to prevent the unhandled promise rejection
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCalendar();
    } else if (e.key === 'Escape') {
      setShowCreateInput(false);
      setNewCalendarName('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
        <span className="loading loading-spinner loading-sm" />
        <span className="text-sm text-base-content/70">Loading calendars...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Calendar</label>
      <details ref={detailsRef} className="dropdown w-full">
        <summary className="btn btn-outline w-full justify-between">
          <span className="flex items-center gap-2">
            {selectedCalendar ? (
              <>
                {selectedCalendar.backgroundColor && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCalendar.backgroundColor }}
                  />
                )}
                <span>{selectedCalendar.summary}</span>
                {selectedCalendar.primary && (
                  <span className="badge badge-sm badge-primary">Primary</span>
                )}
              </>
            ) : (
              <span className="text-base-content/50">Select a calendar</span>
            )}
          </span>
          <ChevronDownIcon />
        </summary>

        <ul className="dropdown-content z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-full max-h-60 overflow-y-auto">
          {calendars.map((calendar) => (
            <li key={calendar.id}>
              <button
                type="button"
                className={`flex items-center gap-2 ${selectedId === calendar.id ? 'active' : ''
                  }`}
                onClick={() => handleSelect(calendar.id)}
              >
                {calendar.backgroundColor && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: calendar.backgroundColor }}
                  />
                )}
                <span className="flex-1 text-left truncate">{calendar.summary}</span>
                {calendar.primary && (
                  <span className="badge badge-xs badge-primary">Primary</span>
                )}
              </button>
            </li>
          ))}

          <div className="divider my-1" />

          {showCreateInput ? (
            <li className="p-2">
              <div className="flex flex-col gap-1 w-full">
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Calendar name"
                    className="input input-sm input-bordered flex-1"
                    value={newCalendarName}
                    onChange={(e) => setNewCalendarName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isCreating}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateCalendar}
                    loading={isCreating}
                    disabled={!newCalendarName.trim()}
                  >
                    Create
                  </Button>
                </div>
                {error && (
                  <span className="text-xs text-error px-1">{error}</span>
                )}
              </div>
            </li>
          ) : (
            <li>
              <button
                type="button"
                className="flex items-center gap-2 text-primary"
                onClick={() => setShowCreateInput(true)}
              >
                <PlusIcon />
                Create new calendar
              </button>
            </li>
          )}
        </ul>
      </details>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

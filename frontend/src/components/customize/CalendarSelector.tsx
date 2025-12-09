'use client';

import { useState, useRef, useEffect } from 'react';
import type { Calendar } from '@/services/calendarService';

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
 * 
 * Simplified implementation to fix button click issues.
 */
export function CalendarSelector({
  calendars,
  selectedId,
  onSelect,
  onCreate,
  isLoading,
  error,
}: CalendarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCalendar = calendars.find((c) => c.id === selectedId);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
        setNewCalendarName('');
        setCreateError(null);
      }
    };

    if (isOpen) {
      // Use mousedown for better UX - captures before button clicks
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when showing create form
  useEffect(() => {
    if (showCreateForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateForm]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      // Closing - reset form state
      setShowCreateForm(false);
      setNewCalendarName('');
      setCreateError(null);
    }
  };

  const handleSelectCalendar = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setShowCreateForm(false);
    setNewCalendarName('');
    setCreateError(null);
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setCreateError(null);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewCalendarName('');
    setCreateError(null);
  };

  const handleCreateCalendar = async () => {
    const trimmedName = newCalendarName.trim();

    if (!trimmedName) {
      setCreateError('Please enter a calendar name');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      console.log('[CalendarSelector] Creating calendar:', trimmedName);
      await onCreate(trimmedName);
      console.log('[CalendarSelector] Calendar created successfully');

      // Success - close form and dropdown
      setNewCalendarName('');
      setShowCreateForm(false);
      setIsOpen(false);
    } catch (err) {
      console.error('[CalendarSelector] Failed to create calendar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create calendar';
      setCreateError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateCalendar();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelCreate();
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

      {/* Custom dropdown */}
      <div ref={dropdownRef} className="relative w-full">
        {/* Dropdown trigger button */}
        <button
          type="button"
          className="btn btn-outline w-full justify-between"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex items-center gap-2 truncate">
            {selectedCalendar ? (
              <>
                {selectedCalendar.backgroundColor && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedCalendar.backgroundColor }}
                  />
                )}
                <span className="truncate">{selectedCalendar.summary}</span>
                {selectedCalendar.primary && (
                  <span className="badge badge-sm badge-primary">Primary</span>
                )}
              </>
            ) : (
              <span className="text-base-content/50">Select a calendar</span>
            )}
          </span>
          <ChevronDownIcon className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full card card-border bg-base-100 shadow-xl max-h-64 overflow-y-auto">
            {/* Calendar list */}
            <ul className="p-2" role="listbox">
              {calendars.map((calendar) => (
                <li key={calendar.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedId === calendar.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-base-200 transition-colors ${selectedId === calendar.id ? 'bg-primary/10 text-primary' : ''
                      }`}
                    onClick={() => handleSelectCalendar(calendar.id)}
                  >
                    {calendar.backgroundColor && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: calendar.backgroundColor }}
                      />
                    )}
                    <span className="flex-1 truncate">{calendar.summary}</span>
                    {calendar.primary && (
                      <span className="badge badge-xs badge-primary">Primary</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-base-300 mx-2" />

            {/* Create calendar section */}
            <div className="p-2">
              {showCreateForm ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="New calendar name"
                      className={`input input-sm flex-1 bg-base-200 focus:bg-base-100 focus:outline-none focus:ring-1 focus:ring-primary ${createError ? 'input-error' : ''}`}
                      value={newCalendarName}
                      onChange={(e) => {
                        setNewCalendarName(e.target.value);
                        if (createError) setCreateError(null);
                      }}
                      onKeyDown={handleKeyDown}
                      disabled={isCreating}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleCreateCalendar}
                      disabled={isCreating || !newCalendarName.trim()}
                    >
                      {isCreating ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        'Create'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={handleCancelCreate}
                      disabled={isCreating}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Error display */}
                  {(createError || error) && (
                    <p className="text-xs text-error px-1">
                      {createError || error}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-primary hover:bg-base-200 transition-colors"
                  onClick={handleShowCreateForm}
                >
                  <PlusIcon />
                  <span>Create new calendar</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Show global error outside dropdown */}
      {error && !isOpen && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 ${className}`}
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

'use client';

import { Alert } from '@/components/common';

export interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
  error?: string;
}

function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  error,
}: DateRangePickerProps) {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onStartChange(new Date(value));
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onEndChange(new Date(value));
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-base font-semibold">Semester Date Range</h3>
        <p className="text-xs text-base-content/70 mt-0.5">
          Set the start and end dates for your semester to generate recurring events.
        </p>
      </div>

      <div className="space-y-2">
        <div className="form-control">
          <label className="label py-0.5" htmlFor="start-date">
            <span className="label-text text-sm font-medium">Start Date</span>
          </label>
          <input
            id="start-date"
            type="date"
            className={`input input-bordered input-sm w-full ${error ? 'input-error' : ''}`}
            value={formatDateForInput(startDate)}
            onChange={handleStartChange}
          />
        </div>

        <div className="form-control">
          <label className="label py-0.5" htmlFor="end-date">
            <span className="label-text text-sm font-medium">End Date</span>
          </label>
          <input
            id="end-date"
            type="date"
            className={`input input-bordered input-sm w-full ${error ? 'input-error' : ''}`}
            value={formatDateForInput(endDate)}
            onChange={handleEndChange}
          />
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} />
      )}
    </div>
  );
}

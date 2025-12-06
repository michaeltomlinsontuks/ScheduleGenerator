'use client';

import React from 'react';

export interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

const statusConfig: Record<UploadProgressProps['status'], {
  label: string;
  progressClass: string;
  icon: React.ReactNode;
}> = {
  uploading: {
    label: 'Uploading...',
    progressClass: 'progress-primary',
    icon: (
      <span className="loading loading-spinner loading-sm text-primary" />
    ),
  },
  processing: {
    label: 'Processing PDF... This may take up to a minute.',
    progressClass: 'progress-primary',
    icon: (
      <span className="loading loading-spinner loading-sm text-primary" />
    ),
  },
  complete: {
    label: 'Complete!',
    progressClass: 'progress-success',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-success"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
  error: {
    label: 'Error',
    progressClass: 'progress-error',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-error"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
};

export function UploadProgress({ progress, status, message }: UploadProgressProps) {
  const config = statusConfig[status];
  const displayMessage = message || config.label;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-sm font-medium text-base-content">
            {displayMessage}
          </span>
        </div>
        <span className="text-sm text-base-content/60">
          {clampedProgress}%
        </span>
      </div>

      <progress
        className={`progress w-full ${config.progressClass}`}
        value={clampedProgress}
        max="100"
        aria-label={`Upload progress: ${clampedProgress}%`}
      />
    </div>
  );
}

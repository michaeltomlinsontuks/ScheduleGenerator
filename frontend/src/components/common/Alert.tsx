'use client';

import React from 'react';

export interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onDismiss?: () => void;
}

const typeClasses: Record<AlertProps['type'], string> = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
};

export function Alert({ type, message, onDismiss }: AlertProps) {
  return (
    <div className={`alert ${typeClasses[type]}`} role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
        </button>
      )}
    </div>
  );
}

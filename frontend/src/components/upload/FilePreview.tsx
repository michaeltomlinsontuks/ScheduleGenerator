'use client';

import React from 'react';
import { formatFileSize } from '@/utils/validation';

export interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="border border-base-300 rounded-lg p-4 bg-base-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* PDF Icon */}
          <div className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          
          {/* File Info */}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-base-content truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-sm text-base-content/60">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        
        {/* Remove Button */}
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
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
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { validateFile, ACCEPTED_EXTENSION } from '@/utils/validation';
import { Alert } from '@/components/common';

export interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  selectedFile?: File | null;
}

export function DropZone({
  onFileSelect,
  onFileRemove,
  accept = ACCEPTED_EXTENSION,
  disabled = false,
  selectedFile = null,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);


  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setError(null);
    onFileRemove();
  }, [onFileRemove]);

  const baseClasses = 'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer';
  const stateClasses = isDragOver
    ? 'border-primary bg-primary/10'
    : disabled
    ? 'border-base-300 bg-base-200 cursor-not-allowed'
    : 'border-base-300 hover:border-primary hover:bg-base-200';

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onDismiss={handleDismissError} />
        </div>
      )}
      
      {!selectedFile ? (
        <div
          className={`${baseClasses} ${stateClasses}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Drop zone for PDF files"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClick();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
            aria-hidden="true"
          />
          
          <div className="flex flex-col items-center gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-12 w-12 ${isDragOver ? 'text-primary' : 'text-base-content/50'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            
            <div>
              <p className="text-lg font-medium text-base-content">
                {isDragOver ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
              </p>
              <p className="mt-1 text-sm text-base-content/60">
                or click to browse (max 10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-base-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-error"
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
              <div>
                <p className="font-medium text-base-content">{selectedFile.name}</p>
                <p className="text-sm text-base-content/60">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleRemoveFile}
              aria-label="Remove file"
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
      )}
    </div>
  );
}

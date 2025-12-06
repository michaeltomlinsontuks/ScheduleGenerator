'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DropZone, FilePreview, UploadProgress } from '@/components/upload';
import { Button } from '@/components/common';
import { useUpload, useJobStatus } from '@/hooks';
import { useEventStore } from '@/stores/eventStore';

type UploadPhase = 'idle' | 'uploading' | 'processing' | 'resuming';

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const hasNavigated = useRef(false);
  const hasCheckedResume = useRef(false);

  // Use real API hooks
  const { upload, progress: uploadProgress, isUploading, error: uploadError, reset: resetUpload } = useUpload();
  const jobId = useEventStore((state) => state.jobId);
  const events = useEventStore((state) => state.events);
  const setJobId = useEventStore((state) => state.setJobId);
  const setJobStatus = useEventStore((state) => state.setJobStatus);

  // Poll for job status when in processing or resuming phase
  const { status: jobStatus, error: jobError } = useJobStatus(
    (uploadPhase === 'processing' || uploadPhase === 'resuming') ? jobId : null
  );

  // Check for existing job on mount and resume if needed
  useEffect(() => {
    if (hasCheckedResume.current) return;
    hasCheckedResume.current = true;

    // If we have a jobId but no events, resume polling
    if (jobId && events.length === 0) {
      console.log('Resuming job polling for jobId:', jobId);
      setUploadPhase('resuming');
    }
  }, [jobId, events.length]);

  // Derive the display status from the current state
  const { uploadStatus, errorMessage } = useMemo(() => {
    // Check for errors first
    if (uploadError) {
      return { uploadStatus: 'error' as const, errorMessage: uploadError };
    }
    if (jobError) {
      return { uploadStatus: 'error' as const, errorMessage: jobError };
    }

    // Check for completion - if we have events, we're done
    if (events.length > 0 && hasNavigated.current) {
      return { uploadStatus: 'complete' as const, errorMessage: null };
    }

    // Map resuming to processing for display
    if (uploadPhase === 'resuming') {
      return { uploadStatus: 'processing' as const, errorMessage: null };
    }

    // Return current phase
    return { uploadStatus: uploadPhase, errorMessage: null };
  }, [uploadError, jobError, events.length, uploadPhase]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setUploadPhase('idle');
    hasNavigated.current = false;
    hasCheckedResume.current = true; // Prevent resume check after manual file selection
    resetUpload();
  }, [resetUpload]);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setUploadPhase('idle');
    hasNavigated.current = false;
    hasCheckedResume.current = true; // Prevent resume check after manual file removal
    resetUpload();
  }, [resetUpload]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadPhase('uploading');

    try {
      // Upload the file using the real API
      // With synchronous processing, events come back immediately
      const events = await upload(selectedFile);

      // Upload succeeded and events are now in store
      // Show complete status briefly before navigating
      if (events && events.length > 0) {
        setUploadPhase('idle'); // Reset phase so displayProgress uses 'complete' path
        hasNavigated.current = true;
        setTimeout(() => {
          router.push('/preview');
        }, 800); // Slightly longer delay to show completion
      } else {
        throw new Error('No events parsed from PDF');
      }
    } catch {
      // Error is already handled by the derived state
      // Reset phase to allow retry
      setUploadPhase('idle');
    }
  }, [selectedFile, upload, router]);

  const handleRetry = useCallback(() => {
    // Clear job state on failure
    setJobId(null);
    setJobStatus(null);
    setUploadPhase('idle');
    hasNavigated.current = false;
    hasCheckedResume.current = true; // Prevent resume check after retry
    resetUpload();
  }, [resetUpload, setJobId, setJobStatus]);

  // Emulate progress during processing phase (since it's synchronous but takes time)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploadStatus === 'processing') {
      // Start at 0 or current progress
      let currentProgress = 0;

      interval = setInterval(() => {
        currentProgress += (1 + Math.random() * 2); // Increment by 1-3%
        if (currentProgress > 90) {
          currentProgress = 90; // Cap at 90% until complete
          clearInterval(interval);
        }
        // We need a way to update the display progress without affecting the actual upload progress state
        // Since we can't easily modify the hook's internal state from here, we'll likely need a local state override
        // or just accept that we need to store this local progress.
      }, 500);
    }
    return () => clearInterval(interval);
  }, [uploadStatus]);

  // We need a local state for the simulated processing progress
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    if (uploadPhase === 'processing') {
      setProcessingProgress(0);
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) return 90;
          return prev + (1 + Math.random() * 5); // Faster increment
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProcessingProgress(0);
    }
  }, [uploadPhase]);

  const isProcessing = uploadStatus === 'uploading' || uploadStatus === 'processing';

  // Calculate display progress:
  // - Uploading: Use real upload progress
  // - Processing: Use simulated processing progress
  // - Complete: 100%
  const displayProgress = uploadStatus === 'uploading' ? uploadProgress :
    uploadStatus === 'processing' ? processingProgress :
      uploadStatus === 'complete' ? 100 : 0;

  // Custom message for resuming state or processing
  const displayMessage = uploadPhase === 'resuming' ? 'Resuming job...' :
    uploadPhase === 'processing' || uploadPhase === 'uploading' ? 'Processing PDF... This may take up to 30 seconds.' :
      errorMessage || undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-base-content">
          Upload Your Schedule
        </h1>
        <p className="mt-2 text-base-content/70">
          Upload your UP PDF schedule to get started
        </p>
      </div>

      <div className="space-y-6">
        {/* DropZone or FilePreview */}
        {!selectedFile ? (
          <DropZone
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            disabled={isProcessing}
          />
        ) : (
          <FilePreview
            file={selectedFile}
            onRemove={handleFileRemove}
          />
        )}

        {/* Upload Progress */}
        {(uploadStatus === 'uploading' || uploadStatus === 'processing' || uploadStatus === 'complete' || uploadStatus === 'error') && (
          <UploadProgress
            progress={displayProgress}
            status={uploadStatus}
            message={displayMessage}
          />
        )}

        {/* Error Retry Button */}
        {uploadStatus === 'error' && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleRetry}>
              Try Again
            </Button>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && uploadStatus === 'idle' && (
          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing}
              loading={isUploading}
            >
              Upload & Process
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Stepper } from '@/components/layout';
import { DropZone, FilePreview, UploadProgress } from '@/components/upload';
import { Button } from '@/components/common';
import { useUpload, useJobStatus } from '@/hooks';
import { useEventStore } from '@/stores/eventStore';

type UploadPhase = 'idle' | 'uploading' | 'processing';

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const hasNavigated = useRef(false);
  
  // Use real API hooks
  const { upload, progress: uploadProgress, isUploading, error: uploadError, reset: resetUpload } = useUpload();
  const jobId = useEventStore((state) => state.jobId);
  const { status: jobStatus, error: jobError } = useJobStatus(
    uploadPhase === 'processing' ? jobId : null
  );

  // Derive the display status from the current state
  const { uploadStatus, errorMessage } = useMemo(() => {
    // Check for errors first
    if (uploadError) {
      return { uploadStatus: 'error' as const, errorMessage: uploadError };
    }
    if (jobError) {
      return { uploadStatus: 'error' as const, errorMessage: jobError };
    }
    if (jobStatus?.status === 'failed') {
      return { 
        uploadStatus: 'error' as const, 
        errorMessage: jobStatus.error || 'Failed to process PDF. Please try again.' 
      };
    }
    
    // Check for completion
    if (jobStatus?.status === 'completed') {
      return { uploadStatus: 'complete' as const, errorMessage: null };
    }
    
    // Return current phase
    return { uploadStatus: uploadPhase, errorMessage: null };
  }, [uploadError, jobError, jobStatus, uploadPhase]);

  // Handle navigation on completion
  useEffect(() => {
    if (jobStatus?.status === 'completed' && !hasNavigated.current) {
      hasNavigated.current = true;
      const timer = setTimeout(() => {
        router.push('/preview');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [jobStatus, router]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setUploadPhase('idle');
    hasNavigated.current = false;
    resetUpload();
  }, [resetUpload]);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setUploadPhase('idle');
    hasNavigated.current = false;
    resetUpload();
  }, [resetUpload]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadPhase('uploading');

    try {
      // Upload the file using the real API
      await upload(selectedFile);
      // After successful upload, start polling for job status
      setUploadPhase('processing');
    } catch {
      // Error is already handled by the derived state
      // but we catch here to prevent unhandled promise rejection
    }
  }, [selectedFile, upload]);

  const handleRetry = useCallback(() => {
    setUploadPhase('idle');
    hasNavigated.current = false;
    resetUpload();
  }, [resetUpload]);

  const isProcessing = uploadStatus === 'uploading' || uploadStatus === 'processing';
  
  // Calculate display progress: during upload show upload progress, during processing show 100
  const displayProgress = uploadStatus === 'uploading' ? uploadProgress : 
                          uploadStatus === 'processing' ? 100 : uploadProgress;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Stepper currentStep={1} />
      
      <div className="mt-8">
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
              message={errorMessage || undefined}
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
    </div>
  );
}

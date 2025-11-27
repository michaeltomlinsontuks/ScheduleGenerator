'use client';

import React from 'react';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeClasses: Record<NonNullable<LoadingProps['size']>, string> = {
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
};

export function Loading({ size = 'md', text }: LoadingProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`loading loading-spinner ${sizeClasses[size]}`} />
      {text && <span>{text}</span>}
    </div>
  );
}

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
} as const;

export function Container({ children, size = 'lg' }: ContainerProps) {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]}`}>
      {children}
    </div>
  );
}

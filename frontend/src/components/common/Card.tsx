'use client';

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  bordered?: boolean;
  className?: string;
}

export function Card({ children, bordered = false, className = '' }: CardProps) {
  const classes = [
    'card',
    'bg-base-100',
    bordered && 'card-border',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

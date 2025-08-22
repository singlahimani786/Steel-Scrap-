'use client';
import { ReactNode } from 'react';

interface LayoutWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function LayoutWrapper({ children, className = '' }: LayoutWrapperProps) {
  return (
    <div className={`pt-20 min-h-screen bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}

'use client';
import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { NextAuthProvider } from '@/components/auth/NextAuthProvider';

export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <NextAuthProvider>
        {children}
        <Toaster />
      </NextAuthProvider>
    </ErrorBoundary>
  );
}

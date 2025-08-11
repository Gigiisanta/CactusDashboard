'use client';
import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
// Removed custom Toaster wrapper; rely on minimal UI
import { NextAuthProvider } from '@/components/auth/NextAuthProvider';

export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <NextAuthProvider>
        {children}
      </NextAuthProvider>
    </ErrorBoundary>
  );
}

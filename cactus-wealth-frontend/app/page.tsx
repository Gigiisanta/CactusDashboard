'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'loading') {
      if (session) {
        // Use replace instead of push to avoid history issues
        router.replace('/dashboard');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-cactus-500'></div>
      </div>
    );
  }

  return null;
}

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    store.setRole('ADMIN');
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <p className="text-sm font-semibold animate-pulse">Redirecting to QueueBite Admin Dashboard...</p>
    </div>
  );
}

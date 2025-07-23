'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily disable authentication for development
  const isDevelopmentMode = true; // Force development mode
  
  // Always call hooks at the top level (before any conditions)
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only run the redirect logic if not in development mode
    if (!isDevelopmentMode && isLoaded && !isSignedIn) {
      router.push('/onboarding');
    }
  }, [isDevelopmentMode, isLoaded, isSignedIn, router]);

  // Skip all authentication logic in development
  if (isDevelopmentMode) {
    return <>{children}</>;
  }

  // Production authentication logic
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
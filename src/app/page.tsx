'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // If user is signed in, check if they've completed onboarding
        // For now, we'll redirect to dashboard
        router.push('/dashboard');
      } else {
        // If user is not signed in, redirect to onboarding
        router.push('/onboarding');
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading FinkArgo...</p>
      </div>
    </div>
  );
}
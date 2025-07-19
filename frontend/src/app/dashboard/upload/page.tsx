'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import UploadInterface from '@/components/UploadInterface';

export default function UploadPage() {
  const { isLoaded, isSignedIn, orgId } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    redirect('/sign-in');
  }

  if (!orgId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please select or create an organization to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Upload Supply Chain Data</h1>
        <UploadInterface orgId={orgId} />
      </div>
    </div>
  );
}
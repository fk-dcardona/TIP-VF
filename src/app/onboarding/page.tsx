'use client';

import { useState } from 'react';
import { EnhancedCompanySetup } from '@/components/onboarding/enhanced-company-setup';
import { DemoDataLoader } from '@/components/onboarding/demo-data-loader';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [companyData, setCompanyData] = useState(null);
  const [showDemoLoader, setShowDemoLoader] = useState(false);
  const router = useRouter();

  const handleCompanySetup = async (data) => {
    setCompanyData(data);
    
    if (data.useDemoData) {
      setShowDemoLoader(true);
    } else {
      // Navigate to dashboard
      router.push('/dashboard');
    }
  };

  const handleDemoComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {!showDemoLoader ? (
        <EnhancedCompanySetup onComplete={handleCompanySetup} />
      ) : (
        <DemoDataLoader 
          companyId={companyData?.id || 'demo-company'} 
          onComplete={handleDemoComplete} 
        />
      )}
    </div>
  );
}

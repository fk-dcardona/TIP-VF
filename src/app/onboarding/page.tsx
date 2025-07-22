'use client';

import { useState } from 'react';
import { EnhancedCompanySetup } from '@/components/onboarding/enhanced-company-setup';
import { DemoDataLoader } from '@/components/onboarding/demo-data-loader';
import { useRouter } from 'next/navigation';

interface CompanyData {
  id?: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  annualRevenue: string;
  employeeCount: string;
  useDemoData?: boolean;
}

export default function OnboardingPage() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [showDemoLoader, setShowDemoLoader] = useState(false);
  const router = useRouter();

  const handleCompanySetup = async (data: CompanyData) => {
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

  const handleBack = () => {
    setShowDemoLoader(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {!showDemoLoader ? (
        <EnhancedCompanySetup onComplete={handleCompanySetup} onBack={() => router.back()} />
      ) : (
        <DemoDataLoader 
          onComplete={handleDemoComplete}
          onSkip={handleDemoComplete}
        />
      )}
    </div>
  );
}

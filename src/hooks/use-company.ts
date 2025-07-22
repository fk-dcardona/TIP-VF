import { useState, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
  country: string;
  industry: string;
  size: string;
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock company data for local development
    const mockCompany: Company = {
      id: 'demo-company-1',
      name: 'Demo Company',
      country: 'CO',
      industry: 'Manufacturing',
      size: 'Medium'
    };

    // Simulate API call
    setTimeout(() => {
      setCompany(mockCompany);
      setLoading(false);
    }, 1000);
  }, []);

  return { company, loading };
} 
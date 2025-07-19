'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function FinancePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Finance Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">$150,000</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total Costs</h3>
          <p className="text-3xl font-bold text-red-600">$75,000</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Profit Margin</h3>
          <p className="text-3xl font-bold text-blue-600">50%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Cash Flow</h3>
          <p className="text-3xl font-bold text-purple-600">$25,000</p>
        </div>
      </div>
    </div>
  );
}
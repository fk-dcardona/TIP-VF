'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function SalesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sales Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Current Revenue</h3>
          <p className="text-3xl font-bold text-green-600">$125,000</p>
          <span className="text-sm text-green-500">+25% growth</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">450</p>
          <span className="text-sm text-gray-500">23 pending</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Active Customers</h3>
          <p className="text-3xl font-bold text-purple-600">234</p>
          <span className="text-sm text-green-500">45 new</span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Conversion Rate</h3>
          <p className="text-3xl font-bold text-orange-600">3.2%</p>
          <span className="text-sm text-gray-500">89% retention</span>
        </div>
      </div>
    </div>
  );
}
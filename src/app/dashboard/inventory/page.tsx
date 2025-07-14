'use client';

import InventoryDashboard from '@/components/InventoryDashboard';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

export default function InventoryPage() {
  return <InventoryDashboard />;
}
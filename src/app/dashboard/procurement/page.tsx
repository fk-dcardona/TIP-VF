import ProcurementDashboard from '@/components/ProcurementDashboard';

export default function ProcurementPage() {
  const mockData = {
    summary: {
      activeSuppliers: 45,
      pendingOrders: 12,
      totalSpend: 89000,
      savingsYTD: 12500
    },
    product_performance: [
      { id: 'PROD-001', name: 'Product A', days_of_stock: 5, sales_velocity: 10 },
      { id: 'PROD-002', name: 'Product B', days_of_stock: 15, sales_velocity: 8 },
      { id: 'PROD-003', name: 'Product C', days_of_stock: 95, sales_velocity: 3 }
    ],
    inventory_alerts: [
      { type: 'low_stock', product: 'Product A', severity: 'high' },
      { type: 'reorder', product: 'Product B', severity: 'medium' }
    ],
    financial_insights: {
      total_inventory_value: 150000,
      procurement_budget: 200000
    },
    key_metrics: {
      activeSuppliers: 45,
      pendingOrders: 12,
      totalSpend: 89000,
      savingsYTD: 12500
    },
    recommendations: [
      "Reorder Product A within 2 days",
      "Consider new suppliers for cost optimization",
      "Review overstock items for liquidation"
    ]
  };

  return <ProcurementDashboard data={mockData} />;
}
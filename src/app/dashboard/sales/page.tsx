import SalesDashboard from '@/components/SalesDashboard';

export default function SalesPage() {
  const mockData = {
    summary: {
      revenue: { current: 125000, previous: 100000, growth: 25 },
      orders: { total: 450, pending: 23, completed: 427 },
      customers: { active: 234, new: 45, retention: 89 }
    },
    product_performance: [
      { id: 'PROD-001', name: 'Product A', sales: 150, revenue: 45000, days_of_stock: 25, sales_velocity: 5 },
      { id: 'PROD-002', name: 'Product B', sales: 120, revenue: 36000, days_of_stock: 30, sales_velocity: 4 },
      { id: 'PROD-003', name: 'Product C', sales: 90, revenue: 27000, days_of_stock: 40, sales_velocity: 3 }
    ],
    inventory_alerts: [
      { type: 'trending', product: 'Product A', severity: 'info' }
    ],
    financial_insights: {
      total_revenue: 125000,
      profit_margin: 23.5
    },
    key_metrics: {
      totalRevenue: 125000,
      totalOrders: 450,
      activeCustomers: 234,
      conversionRate: 3.2
    },
    recommendations: [
      "Focus marketing on Product A - highest performer",
      "Consider promoting Product B to increase sales",
      "Implement customer retention strategies"
    ]
  };

  return <SalesDashboard data={mockData} />;
}
import FinanceDashboard from '@/components/FinanceDashboard';

export default function FinancePage() {
  const mockData = {
    summary: {
      total_revenue: 150000,
      total_costs: 75000,
      profit_margin: 50,
      cash_flow: 25000
    },
    product_performance: [
      { product: 'Product A', revenue: 50000, profit: 25000, margin: 50 },
      { product: 'Product B', revenue: 40000, profit: 16000, margin: 40 },
      { product: 'Product C', revenue: 30000, profit: 12000, margin: 40 }
    ],
    inventory_alerts: [
      { item: 'Raw Material X', status: 'Low Stock', days_remaining: 5 },
      { item: 'Component Y', status: 'Out of Stock', days_remaining: 0 }
    ],
    financial_insights: {
      trends: 'Revenue up 15% MoM',
      recommendations: ['Optimize inventory for Product A', 'Negotiate better rates with Supplier B']
    },
    key_metrics: {
      gross_margin: 52.3,
      operating_margin: 18.7,
      roa: 15.2,
      current_ratio: 2.1
    },
    recommendations: [
      'Optimize inventory for Product A',
      'Negotiate better rates with Supplier B',
      'Consider expanding Product C line'
    ]
  };

  return <FinanceDashboard data={mockData} />;
}
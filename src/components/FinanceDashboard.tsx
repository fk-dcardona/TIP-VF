'use client';

interface FinanceDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
  };
}

export default function FinanceDashboard({ data }: FinanceDashboardProps) {
  const { financial_insights, product_performance, key_metrics } = data;

  // Calculate finance-specific metrics
  const totalInventoryValue = financial_insights?.total_inventory_value || 0;
  const monthlyBurnRate = financial_insights?.monthly_burn_rate || 0;
  const workingCapitalEfficiency = financial_insights?.working_capital_efficiency || 0;
  const inventoryToSalesRatio = financial_insights?.inventory_to_sales_ratio || 0;

  // Calculate cash flow metrics
  const daysOfCashInInventory = monthlyBurnRate > 0 ? (totalInventoryValue / monthlyBurnRate) * 30 : 0;
  const highValueProducts = product_performance.filter(p => (p.current_stock * 10) > 5000); // Assuming $10 avg cost
  const lowTurnoverProducts = product_performance.filter(p => p.inventory_turnover < 2);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getEfficiencyColor = (ratio: number) => {
    if (ratio > 0.7) return 'text-green-600 bg-green-100';
    if (ratio > 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getEfficiencyText = (ratio: number) => {
    if (ratio > 0.7) return 'Excellent';
    if (ratio > 0.4) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Finance Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Finance Dashboard</h2>
            <p className="text-blue-100">Cash flow analysis and financial performance metrics</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <div className="text-blue-200">Cash in Inventory</div>
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Burn Rate</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(monthlyBurnRate)}
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-blue-600 bg-blue-100">
                Inventory Consumption
              </span>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Working Capital Efficiency</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {(workingCapitalEfficiency * 100).toFixed(1)}%
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getEfficiencyColor(workingCapitalEfficiency)}`}>
                {getEfficiencyText(workingCapitalEfficiency)}
              </span>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days of Cash in Inventory</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {daysOfCashInInventory.toFixed(0)}
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                daysOfCashInInventory > 90 ? 'text-red-600 bg-red-100' : 
                daysOfCashInInventory > 60 ? 'text-yellow-600 bg-yellow-100' : 
                'text-green-600 bg-green-100'
              }`}>
                {daysOfCashInInventory > 90 ? 'High' : daysOfCashInInventory > 60 ? 'Medium' : 'Optimal'}
              </span>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory to Sales Ratio</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {inventoryToSalesRatio.toFixed(1)}x
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                inventoryToSalesRatio > 3 ? 'text-red-600 bg-red-100' : 
                inventoryToSalesRatio > 2 ? 'text-yellow-600 bg-yellow-100' : 
                'text-green-600 bg-green-100'
              }`}>
                {inventoryToSalesRatio > 3 ? 'Overstock' : inventoryToSalesRatio > 2 ? 'Monitor' : 'Healthy'}
              </span>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Cash Flow Analysis */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Cash Flow Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalInventoryValue)}
            </div>
            <p className="text-sm text-green-700 mt-1">Total Cash in Inventory</p>
            <p className="text-xs text-green-600 mt-2">Current investment</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(monthlyBurnRate)}
            </div>
            <p className="text-sm text-blue-700 mt-1">Monthly Cash Burn</p>
            <p className="text-xs text-blue-600 mt-2">Inventory consumption rate</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {daysOfCashInInventory.toFixed(0)} days
            </div>
            <p className="text-sm text-purple-700 mt-1">Cash Runway</p>
            <p className="text-xs text-purple-600 mt-2">At current burn rate</p>
          </div>
        </div>
      </div>

      {/* Product Financial Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📈 Product Financial Performance</h3>
          <p className="text-sm text-gray-600">ROI and cash flow impact by product</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turnover</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Impact</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {product_performance.slice(0, 10).map((product) => {
                const inventoryValue = product.current_stock * 10; // Assuming $10 avg cost
                return (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                        <div className="text-sm text-gray-500">{product.current_stock} units</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(inventoryValue)}</div>
                      <div className="text-xs text-gray-500">
                        {((inventoryValue / totalInventoryValue) * 100).toFixed(1)}% of total
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        product.roi_percentage > 30 ? 'text-green-600' : 
                        product.roi_percentage > 15 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product.roi_percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.roi_percentage > 30 ? 'Excellent' : 
                         product.roi_percentage > 15 ? 'Good' : 'Poor'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.inventory_turnover.toFixed(1)}x</div>
                      <div className={`text-xs ${
                        product.inventory_turnover > 4 ? 'text-green-600' : 
                        product.inventory_turnover > 2 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product.inventory_turnover > 4 ? 'Fast' : 
                         product.inventory_turnover > 2 ? 'Moderate' : 'Slow'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        product.inventory_turnover > 4 ? 'text-green-600' : 
                        product.inventory_turnover < 2 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {product.inventory_turnover > 4 ? 'Positive' : 
                         product.inventory_turnover < 2 ? 'Negative' : 'Neutral'}
                      </div>
                      <div className="text-xs text-gray-500">Cash flow impact</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Optimization */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Cash Optimization Opportunities</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">Reduce Slow Movers</p>
              <p className="text-xs text-green-600 mt-1">
                {lowTurnoverProducts.length} products with low turnover could free up {formatCurrency(lowTurnoverProducts.length * 2000)}
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Optimize High-Value Items</p>
              <p className="text-xs text-blue-600 mt-1">
                {highValueProducts.length} high-value products need careful monitoring
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-800">Improve Turnover</p>
              <p className="text-xs text-purple-600 mt-1">
                Target 4x+ turnover to optimize working capital efficiency
              </p>
            </div>
          </div>
        </div>

        {/* Payment Planning */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Payment Planning</h3>
          <div className="space-y-4">
            {/* Mock payment schedule - in real implementation, this would come from supplier/payment data */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Supplier ABC</p>
                <p className="text-sm text-red-600">Due: Dec 15, 2024</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatCurrency(25000)}</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                  Overdue
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Global Supply Co</p>
                <p className="text-sm text-yellow-600">Due: Dec 20, 2024</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatCurrency(18500)}</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-yellow-600 bg-yellow-100">
                  Due Soon
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Premium Materials</p>
                <p className="text-sm text-green-600">Due: Dec 30, 2024</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatCurrency(12000)}</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                  On Track
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Financial Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">💰</div>
            <p className="font-medium text-gray-900">Cash Flow Report</p>
            <p className="text-sm text-gray-500">Generate detailed analysis</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📊</div>
            <p className="font-medium text-gray-900">ROI Analysis</p>
            <p className="text-sm text-gray-500">Product profitability</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📅</div>
            <p className="font-medium text-gray-900">Payment Schedule</p>
            <p className="text-sm text-gray-500">Supplier payments</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">🎯</div>
            <p className="font-medium text-gray-900">Budget Planning</p>
            <p className="text-sm text-gray-500">Future investments</p>
          </button>
        </div>
      </div>

      {/* Cash Flow Alert */}
      {daysOfCashInInventory > 90 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl mr-4">💰</div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Cash Flow Optimization Needed</h4>
                <p className="text-orange-100">
                  You have {daysOfCashInInventory.toFixed(0)} days of cash tied up in inventory. Consider reducing slow-moving stock.
                </p>
              </div>
            </div>
            <button className="bg-white text-orange-600 px-4 py-2 rounded-md font-medium hover:bg-orange-50">
              Optimize Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

interface ProcurementDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
  };
}

export default function ProcurementDashboard({ data }: ProcurementDashboardProps) {
  const { product_performance, inventory_alerts, financial_insights, key_metrics } = data;

  // Calculate procurement-specific metrics
  const reorderNeeded = product_performance.filter(p => p.days_of_stock <= 14);
  const urgentReorders = product_performance.filter(p => p.days_of_stock <= 7);
  const overstockItems = product_performance.filter(p => p.days_of_stock > 90);
  const totalInventoryValue = financial_insights?.total_inventory_value || 0;

  const calculateReorderQuantity = (product: any) => {
    // Simple reorder calculation: 30 days of sales velocity
    return Math.ceil(product.sales_velocity * 30);
  };

  const calculateReorderValue = (product: any) => {
    const quantity = calculateReorderQuantity(product);
    // Assuming cost_per_unit is available in product data
    return quantity * 10; // Placeholder cost
  };

  const getPriorityColor = (daysOfStock: number) => {
    if (daysOfStock <= 0) return 'bg-red-500';
    if (daysOfStock <= 3) return 'bg-red-400';
    if (daysOfStock <= 7) return 'bg-orange-400';
    if (daysOfStock <= 14) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  const getPriorityText = (daysOfStock: number) => {
    if (daysOfStock <= 0) return 'CRITICAL';
    if (daysOfStock <= 3) return 'URGENT';
    if (daysOfStock <= 7) return 'HIGH';
    if (daysOfStock <= 14) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="space-y-6">
      {/* Procurement Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Procurement Dashboard</h2>
            <p className="text-orange-100">Supplier management and reorder optimization</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{urgentReorders.length}</div>
            <div className="text-orange-200">Urgent Reorders</div>
          </div>
        </div>
      </div>

      {/* Procurement KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Items to Reorder</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{reorderNeeded.length}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-orange-600 bg-orange-100">
                Action Required
              </span>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgent Priority</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{urgentReorders.length}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-red-600 bg-red-100">
                ≤ 7 Days
              </span>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overstock Items</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{overstockItems.length}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-blue-600 bg-blue-100">
                Reduce Orders
              </span>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                ${(totalInventoryValue / 1000).toFixed(0)}K
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-green-600 bg-green-100">
                Total Investment
              </span>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>

      {/* Reorder Priority Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">🎯 Reorder Priority Matrix</h3>
          <p className="text-sm text-gray-600">Products requiring immediate procurement attention</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggested Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reorderNeeded.slice(0, 10).map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${getPriorityColor(product.days_of_stock)}`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {getPriorityText(product.days_of_stock)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                      <div className="text-sm text-gray-500">{product.product_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.days_of_stock <= 0 ? 'OUT OF STOCK' : `${product.days_of_stock} days`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Velocity: {product.sales_velocity.toFixed(1)}/day
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{calculateReorderQuantity(product)} units</div>
                    <div className="text-xs text-gray-500">30-day supply</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${calculateReorderValue(product).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Estimated</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      product.days_of_stock <= 7 
                        ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                        : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                    }`}>
                      {product.days_of_stock <= 7 ? 'Order Now' : 'Plan Order'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Procurement Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Performance */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏭 Supplier Performance</h3>
          <div className="space-y-4">
            {/* Mock supplier data - in real implementation, this would come from supplier analysis */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Supplier ABC</p>
                <p className="text-sm text-green-600">On-time delivery: 95%</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                  Excellent
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Supplier XYZ</p>
                <p className="text-sm text-yellow-600">On-time delivery: 78%</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-yellow-600 bg-yellow-100">
                  Needs Improvement
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Global Supply Co</p>
                <p className="text-sm text-blue-600">On-time delivery: 88%</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                  Good
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Optimization */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Cost Optimization</h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Bulk Order Opportunity</p>
              <p className="text-xs text-blue-600 mt-1">
                Combine {urgentReorders.length} urgent orders for better pricing
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">Inventory Optimization</p>
              <p className="text-xs text-green-600 mt-1">
                Reduce overstock by ${(overstockItems.length * 1000).toLocaleString()} potential savings
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-800">Lead Time Analysis</p>
              <p className="text-xs text-purple-600 mt-1">
                Average lead time: 14 days - plan accordingly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Procurement Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📋</div>
            <p className="font-medium text-gray-900">Generate PO</p>
            <p className="text-sm text-gray-500">Create purchase orders</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📊</div>
            <p className="font-medium text-gray-900">Supplier Report</p>
            <p className="text-sm text-gray-500">Performance analysis</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">💰</div>
            <p className="font-medium text-gray-900">Cost Analysis</p>
            <p className="text-sm text-gray-500">Price optimization</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📈</div>
            <p className="font-medium text-gray-900">Forecast Demand</p>
            <p className="text-sm text-gray-500">Future planning</p>
          </button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {urgentReorders.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl mr-4">🚨</div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Urgent Action Required</h4>
                <p className="text-red-100">
                  {urgentReorders.length} products need immediate reordering to avoid stockouts
                </p>
              </div>
            </div>
            <button className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-50">
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


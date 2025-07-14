'use client';

interface LogisticsDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
  };
}

export default function LogisticsDashboard({ data }: LogisticsDashboardProps) {
  const { product_performance, inventory_alerts, key_metrics } = data;

  // Calculate logistics-specific metrics
  const totalProducts = key_metrics?.total_products || 0;
  const fastMovingProducts = product_performance.filter(p => p.sales_velocity > 2);
  const slowMovingProducts = product_performance.filter(p => p.sales_velocity < 0.5);
  const criticalStockAlerts = inventory_alerts.filter(alert => alert.alert_level === 'critical');
  
  // Mock logistics data - in real implementation, this would come from logistics systems
  const warehouseUtilization = 78; // percentage
  const averagePickTime = 12; // minutes
  const shippingAccuracy = 96.5; // percentage
  const inTransitOrders = 23;

  const getVelocityColor = (velocity: number) => {
    if (velocity > 2) return 'text-green-600 bg-green-100';
    if (velocity > 1) return 'text-yellow-600 bg-yellow-100';
    if (velocity > 0.5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getVelocityText = (velocity: number) => {
    if (velocity > 2) return 'Fast Moving';
    if (velocity > 1) return 'Moderate';
    if (velocity > 0.5) return 'Slow Moving';
    return 'Very Slow';
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 90) return 'text-red-600 bg-red-100';
    if (utilization > 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      {/* Logistics Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Logistics Dashboard</h2>
            <p className="text-purple-100">Inventory movement and operational efficiency metrics</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{warehouseUtilization}%</div>
            <div className="text-purple-200">Warehouse Utilization</div>
          </div>
        </div>
      </div>

      {/* Logistics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fast Moving Products</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{fastMovingProducts.length}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-green-600 bg-green-100">
                High Velocity
              </span>
            </div>
            <div className="text-3xl">🚀</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Warehouse Utilization</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{warehouseUtilization}%</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getUtilizationColor(warehouseUtilization)}`}>
                {warehouseUtilization > 90 ? 'Overcapacity' : warehouseUtilization > 75 ? 'High' : 'Optimal'}
              </span>
            </div>
            <div className="text-3xl">🏭</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Pick Time</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{averagePickTime}m</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                averagePickTime < 10 ? 'text-green-600 bg-green-100' : 
                averagePickTime < 15 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
              }`}>
                {averagePickTime < 10 ? 'Excellent' : averagePickTime < 15 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Shipping Accuracy</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{shippingAccuracy}%</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                shippingAccuracy > 95 ? 'text-green-600 bg-green-100' : 
                shippingAccuracy > 90 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
              }`}>
                {shippingAccuracy > 95 ? 'Excellent' : shippingAccuracy > 90 ? 'Good' : 'Poor'}
              </span>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>
      </div>

      {/* Inventory Movement Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📦 Inventory Movement Analysis</h3>
          <p className="text-sm text-gray-600">Product velocity and turnover optimization</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Velocity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turnover</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Impact</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {product_performance.slice(0, 10).map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                      <div className="text-sm text-gray-500">{product.product_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVelocityColor(product.sales_velocity)}`}>
                        {getVelocityText(product.sales_velocity)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {product.sales_velocity.toFixed(1)} units/day
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.current_stock} units</div>
                    <div className="text-xs text-gray-500">
                      {product.days_of_stock} days supply
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.inventory_turnover.toFixed(1)}x</div>
                    <div className={`text-xs ${
                      product.inventory_turnover > 4 ? 'text-green-600' : 
                      product.inventory_turnover > 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {product.inventory_turnover > 4 ? 'Efficient' : 
                       product.inventory_turnover > 2 ? 'Moderate' : 'Inefficient'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      product.sales_velocity > 2 ? 'text-green-600' : 
                      product.sales_velocity < 0.5 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {product.sales_velocity > 2 ? 'Prime Location' : 
                       product.sales_velocity < 0.5 ? 'Back Storage' : 'Standard'}
                    </div>
                    <div className="text-xs text-gray-500">Recommended placement</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Optimization */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏭 Warehouse Optimization</h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Fast Moving Zone</p>
                  <p className="text-sm text-green-600">{fastMovingProducts.length} products</p>
                </div>
                <div className="text-green-600 font-bold">A-Zone</div>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-yellow-800">Moderate Moving Zone</p>
                  <p className="text-sm text-yellow-600">
                    {product_performance.filter(p => p.sales_velocity >= 0.5 && p.sales_velocity <= 2).length} products
                  </p>
                </div>
                <div className="text-yellow-600 font-bold">B-Zone</div>
              </div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-800">Slow Moving Zone</p>
                  <p className="text-sm text-red-600">{slowMovingProducts.length} products</p>
                </div>
                <div className="text-red-600 font-bold">C-Zone</div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Alerts */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Operational Alerts</h3>
          <div className="space-y-3">
            {criticalStockAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800">{alert.product_name}</p>
                    <p className="text-sm text-red-600">
                      {alert.alert_type === 'stockout' ? 'Out of Stock' : 'Critical Low Stock'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-800">{alert.current_stock} units</p>
                    <button className="text-xs bg-red-600 text-white px-2 py-1 rounded mt-1">
                      Urgent
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Mock operational alerts */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-yellow-800">Pick Time Increase</p>
                  <p className="text-sm text-yellow-600">Zone A efficiency down 15%</p>
                </div>
                <div className="text-right">
                  <button className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                    Monitor
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800">Capacity Alert</p>
                  <p className="text-sm text-blue-600">Warehouse 78% full</p>
                </div>
                <div className="text-right">
                  <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{inTransitOrders}</div>
            <p className="text-sm text-blue-700 mt-1">Orders In Transit</p>
            <p className="text-xs text-blue-600 mt-2">Active shipments</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{averagePickTime}m</div>
            <p className="text-sm text-green-700 mt-1">Average Pick Time</p>
            <p className="text-xs text-green-600 mt-2">Per order efficiency</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{shippingAccuracy}%</div>
            <p className="text-sm text-purple-700 mt-1">Shipping Accuracy</p>
            <p className="text-xs text-purple-600 mt-2">Order fulfillment quality</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">2.3x</div>
            <p className="text-sm text-orange-700 mt-1">Avg Inventory Turnover</p>
            <p className="text-xs text-orange-600 mt-2">Overall efficiency</p>
          </div>
        </div>
      </div>

      {/* Logistics Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Logistics Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📦</div>
            <p className="font-medium text-gray-900">Optimize Layout</p>
            <p className="text-sm text-gray-500">Reorganize warehouse zones</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">🚚</div>
            <p className="font-medium text-gray-900">Shipping Schedule</p>
            <p className="text-sm text-gray-500">Plan outbound logistics</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📊</div>
            <p className="font-medium text-gray-900">Performance Report</p>
            <p className="text-sm text-gray-500">Operational metrics</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">⚙️</div>
            <p className="font-medium text-gray-900">Process Optimization</p>
            <p className="text-sm text-gray-500">Improve efficiency</p>
          </button>
        </div>
      </div>

      {/* Capacity Alert */}
      {warehouseUtilization > 85 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl mr-4">🏭</div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Warehouse Capacity Alert</h4>
                <p className="text-orange-100">
                  Warehouse is {warehouseUtilization}% full. Consider optimizing layout or expanding capacity.
                </p>
              </div>
            </div>
            <button className="bg-white text-orange-600 px-4 py-2 rounded-md font-medium hover:bg-orange-50">
              Optimize
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


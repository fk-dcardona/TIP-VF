'use client';

interface SalesDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
  };
}

export default function SalesDashboard({ data }: SalesDashboardProps) {
  const { product_performance, inventory_alerts, key_metrics } = data;

  // Filter products for sales insights
  const availableProducts = product_performance.filter(p => p.days_of_stock > 7);
  const lowStockProducts = product_performance.filter(p => p.days_of_stock <= 7 && p.days_of_stock > 0);
  const outOfStockProducts = product_performance.filter(p => p.days_of_stock <= 0);
  const highROIProducts = product_performance.filter(p => p.roi_percentage > 30);

  const getStockStatusColor = (daysOfStock: number) => {
    if (daysOfStock <= 0) return 'bg-red-100 text-red-800';
    if (daysOfStock <= 7) return 'bg-yellow-100 text-yellow-800';
    if (daysOfStock <= 14) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = (daysOfStock: number) => {
    if (daysOfStock <= 0) return 'Out of Stock';
    if (daysOfStock <= 7) return 'Low Stock';
    if (daysOfStock <= 14) return 'Reorder Soon';
    return 'In Stock';
  };

  return (
    <div className="space-y-6">
      {/* Sales Team Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Sales Dashboard</h2>
            <p className="text-green-100">Product performance and inventory availability for sales optimization</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{availableProducts.length}</div>
            <div className="text-green-200">Products Available</div>
          </div>
        </div>
      </div>

      {/* Sales KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High-Margin Products</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{highROIProducts.length}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-green-600 bg-green-100">
                Focus Items
              </span>
            </div>
            <div className="text-3xl">💎</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available to Sell</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{availableProducts.length}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-green-600 bg-green-100">
                Ready
              </span>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Alert</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{lowStockProducts.length}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-yellow-600 bg-yellow-100">
                Caution
              </span>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <div className="text-2xl font-bold text-gray-900 mt-2">{outOfStockProducts.length}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-red-600 bg-red-100">
                Unavailable
              </span>
            </div>
            <div className="text-3xl">🚫</div>
          </div>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📈 Product Performance & Availability</h3>
          <p className="text-sm text-gray-600">Real-time inventory status for sales planning</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Velocity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(product.days_of_stock)}`}>
                      {getStockStatusText(product.days_of_stock)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {product.days_of_stock > 0 ? `${product.days_of_stock} days left` : 'Restock needed'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.sales_velocity.toFixed(1)} units/day</div>
                    <div className="text-xs text-gray-500">Turnover: {product.inventory_turnover.toFixed(1)}x</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${product.roi_percentage > 30 ? 'text-green-600' : product.roi_percentage > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {product.roi_percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.roi_percentage > 30 ? 'High margin' : product.roi_percentage > 15 ? 'Good margin' : 'Low margin'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 max-w-xs">
                      {product.recommendations.length > 0 ? product.recommendations[0] : 'No specific action needed'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Priority Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Focus on These Products</h3>
          <div className="space-y-3">
            {highROIProducts.slice(0, 5).map((product) => (
              <div key={product.product_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.product_name}</p>
                  <p className="text-sm text-green-600">High ROI: {product.roi_percentage}%</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(product.days_of_stock)}`}>
                    {getStockStatusText(product.days_of_stock)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alerts for Sales */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Inventory Alerts</h3>
          <div className="space-y-3">
            {inventory_alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                alert.alert_level === 'critical' ? 'bg-red-50 border border-red-200' :
                alert.alert_level === 'high' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alert.product_name}</p>
                    <p className={`text-sm ${
                      alert.alert_level === 'critical' ? 'text-red-600' :
                      alert.alert_level === 'high' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {alert.alert_type === 'stockout' ? 'Out of Stock' :
                       alert.alert_type === 'low_stock' ? 'Low Stock' : 'Overstock'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{alert.current_stock} units</p>
                    {alert.days_until_stockout && (
                      <p className="text-xs text-gray-500">{alert.days_until_stockout} days left</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Recommended Sales Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-lg mb-2">💎</div>
            <h4 className="font-medium text-green-800 mb-1">Push High-Margin Items</h4>
            <p className="text-sm text-green-600">Focus on {highROIProducts.length} products with ROI &gt; 30%</p>
            <button className="mt-3 text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700">
              View List
            </button>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-lg mb-2">⚠️</div>
            <h4 className="font-medium text-yellow-800 mb-1">Limited Stock Items</h4>
            <p className="text-sm text-yellow-600">{lowStockProducts.length} products need urgent sales push</p>
            <button className="mt-3 text-xs bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700">
              View Alerts
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-lg mb-2">📊</div>
            <h4 className="font-medium text-blue-800 mb-1">Performance Report</h4>
            <p className="text-sm text-blue-600">Generate sales performance summary</p>
            <button className="mt-3 text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-3">📋 Quick Sales Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">✅ Safe to Promise:</p>
            <p className="text-purple-100">{availableProducts.length} products with 7+ days stock</p>
          </div>
          <div>
            <p className="font-medium mb-1">⚠️ Sell with Caution:</p>
            <p className="text-purple-100">{lowStockProducts.length} products with limited stock</p>
          </div>
          <div>
            <p className="font-medium mb-1">🚫 Do Not Promise:</p>
            <p className="text-purple-100">{outOfStockProducts.length} products out of stock</p>
          </div>
        </div>
      </div>
    </div>
  );
}


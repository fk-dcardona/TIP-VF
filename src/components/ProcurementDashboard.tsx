'use client';

import { ProcurementDashboardSkeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProcurementDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
    supplier_performance?: any[];
    purchase_orders?: any[];
  } | null;
  onDataUpdate?: () => void;
  loading?: boolean;
  error?: Error | null;
  isRetrying?: boolean;
  analytics?: any;
}

export default function ProcurementDashboard({ 
  data, 
  onDataUpdate, 
  loading = false, 
  error = null,
  isRetrying = false,
  analytics
}: ProcurementDashboardProps) {
  // Show loading state
  if (loading && !data) {
    return <ProcurementDashboardSkeleton />;
  }
  
  // Show error state
  if (error && !data) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Failed to load procurement data</AlertTitle>
        <AlertDescription className="text-red-700">
          {error.message || 'Unable to retrieve procurement analytics.'}
          {onDataUpdate && (
            <div className="mt-4">
              <Button 
                onClick={onDataUpdate} 
                disabled={isRetrying}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Use data with fallbacks
  const product_performance = data?.product_performance || [];
  const inventory_alerts = data?.inventory_alerts || [];
  const financial_insights = data?.financial_insights || {};
  const key_metrics = data?.key_metrics || {};
  const supplier_performance = data?.supplier_performance || analytics?.supplier_performance || [];

  // Calculate procurement-specific metrics
  const reorderNeeded = product_performance.filter(p => p.days_of_stock <= 14);
  const urgentReorders = product_performance.filter(p => p.days_of_stock <= 7);
  const overstockItems = product_performance.filter(p => p.days_of_stock > 90);
  const totalInventoryValue = financial_insights?.total_inventory_value || 0;

  const calculateReorderQuantity = (product: any) => {
    // Use API-provided reorder quantity or calculate based on sales velocity
    if (product.recommended_reorder_qty) {
      return product.recommended_reorder_qty;
    }
    // Fallback calculation: safety stock days * sales velocity
    const safetyStockDays = product.safety_stock_days || 30;
    return Math.ceil(product.sales_velocity * safetyStockDays);
  };

  const calculateReorderValue = (product: any) => {
    const quantity = calculateReorderQuantity(product);
    // Use actual cost per unit from API data
    const costPerUnit = product.unit_cost || product.cost_per_unit || 
                       financial_insights?.avg_cost_per_unit || 10;
    return quantity * costPerUnit;
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
            {supplier_performance.length > 0 ? (
              supplier_performance.slice(0, 5).map((supplier: any, index: number) => {
                const deliveryRate = supplier.on_time_delivery_rate || supplier.delivery_performance || 0;
                const rating = supplier.overall_rating || supplier.performance_score || 0;
                
                // Determine performance level based on delivery rate
                const performanceLevel = 
                  deliveryRate >= 95 ? { color: 'green', text: 'Excellent' } :
                  deliveryRate >= 85 ? { color: 'blue', text: 'Good' } :
                  deliveryRate >= 75 ? { color: 'yellow', text: 'Needs Improvement' } :
                  { color: 'red', text: 'Poor' };
                
                return (
                  <div key={index} className={`flex items-center justify-between p-3 bg-${performanceLevel.color}-50 rounded-lg`}>
                    <div>
                      <p className="font-medium text-gray-900">{supplier.name || supplier.supplier_name}</p>
                      <p className={`text-sm text-${performanceLevel.color}-600`}>
                        On-time delivery: {deliveryRate.toFixed(1)}%
                      </p>
                      {supplier.total_orders && (
                        <p className="text-xs text-gray-500">
                          {supplier.total_orders} orders • Avg lead time: {supplier.avg_lead_time || 'N/A'} days
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-${performanceLevel.color}-600 bg-${performanceLevel.color}-100`}>
                        {performanceLevel.text}
                      </span>
                      {rating > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Rating: {rating.toFixed(1)}/5
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No supplier performance data available</p>
                {onDataUpdate && (
                  <Button
                    onClick={onDataUpdate}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>
                )}
              </div>
            )}
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
                Average lead time: {analytics?.avg_lead_time || key_metrics?.avg_lead_time || 14} days - plan accordingly
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


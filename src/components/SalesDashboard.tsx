'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerSegmentation from './CustomerSegmentation';
import GeographicSalesMap from './GeographicSalesMap';
import PricingOptimization from './PricingOptimization';
import { Users, MapPin, DollarSign, TrendingUp, Package, Target } from 'lucide-react';

interface SalesDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
  } | null;
}

export default function SalesDashboard({ data }: SalesDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Handle null data
  const product_performance = data?.product_performance || [];
  const inventory_alerts = data?.inventory_alerts || [];
  const key_metrics = data?.key_metrics || {};
  
  // Transform data for customer segmentation
  const customerData = useMemo(() => {
    if (!data?.product_performance) return [];
    
    // Group by assumed customer data from product performance
    // In real implementation, this would come from customer API
    const mockCustomers = [
      { id: '1', name: 'Acme Corp', industry: 'Manufacturing', region: 'North America', 
        revenue: 2500000, orderCount: 145, avgOrderValue: 17241, lastOrderDate: '2024-01-15',
        growthRate: 23.5, segment: 'enterprise' as const },
      { id: '2', name: 'Global Logistics', industry: 'Transportation', region: 'Europe',
        revenue: 1800000, orderCount: 98, avgOrderValue: 18367, lastOrderDate: '2024-01-14',
        growthRate: 15.2, segment: 'enterprise' as const },
      { id: '3', name: 'TechStart Inc', industry: 'Technology', region: 'Asia Pacific',
        revenue: 650000, orderCount: 67, avgOrderValue: 9701, lastOrderDate: '2024-01-13',
        growthRate: 45.8, segment: 'mid-market' as const },
      { id: '4', name: 'Retail Plus', industry: 'Retail', region: 'North America',
        revenue: 420000, orderCount: 52, avgOrderValue: 8077, lastOrderDate: '2024-01-12',
        growthRate: 12.3, segment: 'small-business' as const },
      { id: '5', name: 'Supply Chain Pro', industry: 'Logistics', region: 'South America',
        revenue: 980000, orderCount: 78, avgOrderValue: 12564, lastOrderDate: '2024-01-11',
        growthRate: 28.9, segment: 'mid-market' as const }
    ];
    
    return mockCustomers;
  }, [data]);
  
  // Transform data for geographic visualization
  const geographicData = useMemo(() => {
    if (!data?.product_performance) return [];
    
    // Mock geographic data - would come from API
    return [
      { id: 'na', name: 'North America', coordinates: { x: 200, y: 150 },
        sales: 4200000, customers: 142, growth: 18.5, 
        topProducts: ['Widget A', 'Component B', 'Material C'],
        marketShare: 35 },
      { id: 'eu', name: 'Europe', coordinates: { x: 400, y: 120 },
        sales: 3100000, customers: 98, growth: 12.3,
        topProducts: ['Component B', 'Widget D', 'Supply Kit'],
        marketShare: 28 },
      { id: 'apac', name: 'Asia Pacific', coordinates: { x: 600, y: 200 },
        sales: 2800000, customers: 115, growth: 32.7,
        topProducts: ['Material C', 'Widget A', 'Tool Set'],
        marketShare: 22 },
      { id: 'sa', name: 'South America', coordinates: { x: 250, y: 280 },
        sales: 980000, customers: 45, growth: 28.9,
        topProducts: ['Supply Kit', 'Component B'],
        marketShare: 15 },
      { id: 'mea', name: 'Middle East', coordinates: { x: 450, y: 180 },
        sales: 620000, customers: 28, growth: 15.4,
        topProducts: ['Widget D', 'Material C'],
        marketShare: 12 }
    ];
  }, [data]);
  
  // Transform data for pricing optimization
  const pricingData = useMemo(() => {
    if (!data?.product_performance) return [];
    
    return data.product_performance.slice(0, 10).map(product => ({
      id: product.product_id,
      name: product.product_name,
      currentPrice: 100, // Mock current price
      optimalPrice: 100 * (1 + (product.roi_percentage / 100) * 0.3), // Simple optimal price calc
      elasticity: 1.2, // Mock elasticity
      competitorPrice: 95, // Mock competitor price
      margin: product.roi_percentage,
      volume: product.current_stock,
      revenueImpact: product.current_stock * 10 * (product.roi_percentage / 100)
    }));
  }, [data]);

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
      {/* Enhanced Sales Header with Business Question Metrics */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Sales Intelligence Dashboard</h2>
            <p className="text-green-100">Complete visibility into what you're selling, to whom, where, and for how much</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{availableProducts.length}</div>
            <div className="text-green-200">Products Available</div>
          </div>
        </div>
        
        {/* Business Question 1 Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-green-500">
          <div>
            <p className="text-green-200 text-sm">What: Products</p>
            <p className="text-xl font-semibold">{product_performance.length} SKUs</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">To Whom: Customers</p>
            <p className="text-xl font-semibold">{customerData.length} Active</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Where: Regions</p>
            <p className="text-xl font-semibold">{geographicData.length} Markets</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">How Much: Optimization</p>
            <p className="text-xl font-semibold">{pricingData.filter(p => Math.abs(p.optimalPrice - p.currentPrice) < 5).length} Optimal</p>
          </div>
        </div>
      </div>

      {/* Tabbed Interface for Business Question 1 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="geography" className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Geography
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Original Sales KPIs */}
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
        </TabsContent>
        
        <TabsContent value="customers">
          <CustomerSegmentation 
            customers={customerData} 
            loading={false}
          />
        </TabsContent>
        
        <TabsContent value="geography">
          <GeographicSalesMap 
            regionData={geographicData} 
            loading={false}
          />
        </TabsContent>
        
        <TabsContent value="pricing">
          <PricingOptimization 
            products={pricingData} 
            loading={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


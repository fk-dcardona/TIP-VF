'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  Users, 
  BarChart3,
  FileText,
  Bell,
  Settings,
  Database,
  Zap
} from 'lucide-react';

// Import all dashboard components
import { OverviewTab } from '@/Dashboard/OverviewTab';
import { AnalyticsTab } from '@/Dashboard/AnalyticsTab';
import SalesIntelligenceTab from '@/Dashboard/SalesIntelligenceTab';
import { AlertsTab } from '@/Dashboard/AlertsTab';
import { ProductTable } from '@/Dashboard/ProductTable';
import { EnhancedProductTable } from '@/Dashboard/EnhancedProductTable';
import { BusinessIntelligenceAlertPanel } from '@/Dashboard/BusinessIntelligenceAlertPanel';
import { CollapsibleProcurementRecommendations } from '@/Dashboard/CollapsibleProcurementRecommendations';

// Import analytics components
import { SolidAnalyticsDashboard } from '@/components/dashboard/SolidAnalyticsDashboard';
import { RealTimeDashboard } from '@/components/dashboard/real-time-dashboard';

// Import upload components
import { EnhancedUploadWizard } from '@/components/upload/EnhancedUploadWizard';

// Import charts
import { StockEfficiencyMatrix } from '@/Charts/StockEfficiencyMatrix';
import { InteractiveSalesChart } from '@/Charts/InteractiveSalesChart';
import { RevenueChart } from '@/Charts/RevenueChart';
import { GroupPerformanceChart } from '@/Charts/GroupPerformanceChart';

// Import hooks
import { useSupplyChainData } from '@/useSupplyChainData';
import { useSalesData } from '@/useSalesData';
import { 
  useInventoryAnalytics, 
  useSalesAnalytics, 
  useSupplierAnalytics, 
  useCrossReferenceAnalytics,
  useAllAnalytics 
} from '@/hooks/useSolidAnalytics';

// Import types
import type { 
  ProcessedProduct, 
  DiscontinuedProductAlert, 
  StockEfficiencyData,
  ProcurementRecommendation 
} from '@/types';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Data hooks
  const supplyChainData = useSupplyChainData();
  const salesData = useSalesData({ 
    timeRange: { startDate: '2024-01-01', endDate: '2024-12-31' }, 
    enablePagination: false 
  });
  
  // Individual analytics hooks
  const inventoryAnalytics = useInventoryAnalytics('demo_org');
  const salesAnalytics = useSalesAnalytics('demo_org');
  const supplierAnalytics = useSupplierAnalytics('demo_org');
  const crossReferenceAnalytics = useCrossReferenceAnalytics('demo_org');

  // Update timestamp every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mock data for demonstration with correct types
  const mockProducts: ProcessedProduct[] = [
    {
      code: 'TECH-001',
      name: 'Advanced Microprocessor',
      group: 'Electronics',
      currentStock: 150,
      revenue: 125000,
      margin: 23.5,
      turnoverRate: 12.5,
      stockStatus: 'NORMAL',
      averageCost: 45.50,
      monthlySales: 2500,
      averageInventory: 120,
      inventoryCarryingCost: 2500,
      monthlyUsage: 2500
    },
    {
      code: 'GLOB-002',
      name: 'Industrial Sensors',
      group: 'Automation',
      currentStock: 75,
      revenue: 89000,
      margin: 18.2,
      turnoverRate: 8.2,
      stockStatus: 'LOW_STOCK',
      averageCost: 89.99,
      monthlySales: 1200,
      averageInventory: 85,
      inventoryCarryingCost: 1800,
      monthlyUsage: 1200
    }
  ];

  const mockDiscontinuedProducts: DiscontinuedProductAlert[] = [
    {
      productCode: 'OLD-001',
      productName: 'Legacy Component',
      lastSeenPeriod: '2024-01',
      monthsMissing: 3,
      previousRevenue: 15000,
      previousMargin: 15.5,
      recommendation: 'REVIEW',
      reasoning: 'Consider replacement with newer model'
    }
  ];

  const mockStockEfficiencyData: StockEfficiencyData[] = mockProducts.map(p => ({
    productCode: p.code,
    productName: p.name,
    turnoverRate: p.turnoverRate,
    marginPercentage: p.margin,
    revenue: p.revenue,
    stockValue: p.currentStock * p.averageCost
  }));

  const mockProcurementRecommendations: ProcurementRecommendation[] = [
    {
      productCode: 'TECH-001',
      recommendedQuantity: 200,
      estimatedCost: 9100,
      urgency: 'medium',
      reason: 'Stock levels below optimal threshold'
    },
    {
      productCode: 'GLOB-002',
      recommendedQuantity: 150,
      estimatedCost: 13498.50,
      urgency: 'high',
      reason: 'Critical stock levels detected'
    }
  ];

  const mockPeriods = ['2024-01', '2024-02', '2024-03', '2024-04'];

  // Mock chart data with correct types
  const mockRevenueData = [
    { name: 'Jan', value: 120000, actual: 120000, forecast: 125000 },
    { name: 'Feb', value: 135000, actual: 135000, forecast: 140000 },
    { name: 'Mar', value: 142000, actual: 142000, forecast: 145000 },
    { name: 'Apr', value: 158000, actual: 158000, forecast: 160000 }
  ];

  const mockGroupData = [
    { name: 'Electronics', value: 85, performance: 85 },
    { name: 'Automation', value: 92, performance: 92 },
    { name: 'Components', value: 78, performance: 78 }
  ];

  const mockSalesData = [
    { period: '2024-01-01', value: 45000, metric: 'sales' },
    { period: '2024-01-02', value: 52000, metric: 'sales' },
    { period: '2024-01-03', value: 48000, metric: 'sales' }
  ];

  // Mock products for AlertsTab
  const mockProductsForAlerts: ProcessedProduct[] = [
    {
      code: 'TECH-001',
      name: 'Advanced Microprocessor',
      group: 'Electronics',
      currentStock: 150,
      revenue: 125000,
      margin: 23.5,
      turnoverRate: 12.5,
      stockStatus: 'NORMAL'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supply Chain Intelligence Platform</h1>
            <p className="text-gray-600 mt-2">Comprehensive analytics and monitoring dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live</span>
            </Badge>
            <Badge variant="outline">
              Updated {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Sales</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Agents</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab
            products={mockProducts}
            discontinuedProducts={mockDiscontinuedProducts}
            selectedPeriod="2024-04"
            availablePeriods={mockPeriods}
            onPeriodChange={(period) => console.log('Period changed:', period)}
          />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>CSV Data Upload</span>
              </CardTitle>
              <CardDescription>
                Upload your inventory and sales data to generate comprehensive supply chain analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedUploadWizard
                orgId="demo_org" // TODO: Get from auth context
                onComplete={() => {
                  // Refresh analytics data and switch to analytics tab
                  setActiveTab('analytics');
                }}
                onCancel={() => setActiveTab('overview')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>BCG Matrix Analysis</span>
                </CardTitle>
                <CardDescription>
                  Stock efficiency and profitability matrix
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StockEfficiencyMatrix data={mockStockEfficiencyData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Revenue Trends</span>
                </CardTitle>
                <CardDescription>
                  Monthly revenue performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart data={mockRevenueData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Group Performance</span>
                </CardTitle>
                <CardDescription>
                  Performance by product group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GroupPerformanceChart data={mockGroupData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Sales Intelligence</span>
                </CardTitle>
                <CardDescription>
                  Interactive sales analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InteractiveSalesChart 
                  data={mockSalesData}
                  title="Sales Performance"
                  type="line"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <SalesIntelligenceTab />
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Supplier Performance</span>
                </CardTitle>
                <CardDescription>
                  Cross-reference analytics and supplier impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supplierAnalytics.loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supplierAnalytics.data?.map((supplier, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold">{supplier.supplier_name}</h4>
                        <p className="text-sm text-gray-600">Health Score: {supplier.health_score}%</p>
                        <p className="text-sm text-gray-600">Products: {supplier.products_supplied.length}</p>
                        <p className="text-sm text-gray-600">Risk Level: {supplier.risk_level}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Procurement Recommendations</span>
                </CardTitle>
                <CardDescription>
                  AI-powered procurement insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CollapsibleProcurementRecommendations recommendations={mockProcurementRecommendations} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <AlertsTab products={mockProductsForAlerts} />
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>AI Agents Status</span>
                </CardTitle>
                <CardDescription>
                  Real-time agent performance and health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Analytics Agent</span>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Supply Chain Agent</span>
                    </div>
                    <Badge variant="secondary">Processing</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="font-medium">Document Intelligence</span>
                    </div>
                    <Badge variant="secondary">Idle</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Agent Analytics</span>
                </CardTitle>
                <CardDescription>
                  Performance metrics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Tasks Processed</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Success Rate</span>
                    <span className="font-semibold text-green-600">98.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Response Time</span>
                    <span className="font-semibold">2.3s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Sessions</span>
                    <span className="font-semibold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
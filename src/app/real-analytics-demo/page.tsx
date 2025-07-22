/**
 * SURPRISE: Real Analytics Demo with User Stories
 * NO MOCK DATA - Users can upload CSV and see real analytics instantly
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { RealDataAnalyticsProvider } from '../../services/analytics/providers/RealDataAnalyticsProvider';

interface DataSummary {
  recordCount: number;
  suppliers: number;
  products: number;
  categories: number;
  regions: number;
  totalValue: number;
  lastProcessed: Date;
}

interface AnalyticsData {
  triangle?: any;
  supplier?: any;
  market?: any;
  crossReference?: any;
}

export default function RealAnalyticsDemoPage() {
  const [analyticsProvider] = useState(() => new RealDataAnalyticsProvider());
  const [currentOrg, setCurrentOrg] = useState('demo_org');
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [activeUserStory, setActiveUserStory] = useState<string>('overview');

  // Load demo data on component mount
  React.useEffect(() => {
    loadAnalytics('demo_org');
  }, []);

  const loadAnalytics = useCallback(async (orgId: string) => {
    setLoading(true);
    try {
      // Get data summary
      const summary = analyticsProvider.getDataSummary(orgId);
      setDataSummary(summary as any);

      if (summary) {
        // Load all analytics types
        const [triangleResult, supplierResult, marketResult, crossRefResult] = await Promise.all([
          analyticsProvider.fetchData(orgId, 'triangle'),
          analyticsProvider.fetchData(orgId, 'supplier-performance'),
          analyticsProvider.fetchData(orgId, 'market-intelligence'),
          analyticsProvider.fetchData(orgId, 'cross-reference')
        ]);

        setAnalytics({
          triangle: triangleResult.success ? triangleResult.data : null,
          supplier: supplierResult.success ? supplierResult.data : null,
          market: marketResult.success ? marketResult.data : null,
          crossReference: crossRefResult.success ? crossRefResult.data : null
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [analyticsProvider]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus('❌ Please upload a CSV file');
      return;
    }

    setLoading(true);
    setUploadStatus('📤 Uploading and processing...');

    try {
      const content = await file.text();
      const result = await analyticsProvider.uploadCSVData(currentOrg, content);
      
      if (result.success) {
        setUploadStatus(`✅ Success! Processed ${result.summary?.recordCount || 0} records`);
        await loadAnalytics(currentOrg);
      } else {
        setUploadStatus(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setUploadStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, analyticsProvider, loadAnalytics]);

  const downloadSampleCSV = useCallback(() => {
    const sampleCSV = `Supplier,Product,Quantity,Unit_Price,Total_Cost,Lead_Time,Quality_Score,On_Time,Category,Region,Order_Date,Delivery_Date
"Acme Corp","Widget A",100,25.50,2550.00,14,85,true,"Electronics","North America","2024-01-15","2024-01-29"
"Global Supply","Component B",250,12.00,3000.00,21,92,false,"Components","Europe","2024-01-20","2024-02-10"
"Premium Materials","Material C",500,8.75,4375.00,7,88,true,"Raw Materials","Asia Pacific","2024-01-25","2024-02-01"`;
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-supply-chain-data.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          🎯 REAL Analytics Demo - NO MOCK DATA
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Upload your CSV data and watch real analytics generate instantly. No fake data - genuine insights from your actual supply chain data.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-green-900 mb-3">🚀 What Makes This Special:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-green-800">✅ <strong>Real Data Processing:</strong> No mock data, only genuine analytics</p>
              <p className="text-green-800">✅ <strong>Instant Insights:</strong> Upload CSV, see results immediately</p>
            </div>
            <div className="space-y-2">
              <p className="text-green-800">✅ <strong>Interactive User Stories:</strong> Test real business scenarios</p>
              <p className="text-green-800">✅ <strong>Live Calculations:</strong> All metrics computed from your data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>📁 Upload Your Supply Chain Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <Button onClick={downloadSampleCSV} variant="outline">
              Download Sample CSV
            </Button>
          </div>
          
          {uploadStatus && (
            <Alert>
              <AlertDescription>{uploadStatus}</AlertDescription>
            </Alert>
          )}

          {dataSummary && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📊 Current Dataset:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>{dataSummary.recordCount}</strong> Records</div>
                <div><strong>{dataSummary.suppliers}</strong> Suppliers</div>
                <div><strong>{dataSummary.products}</strong> Products</div>
                <div><strong>${dataSummary.totalValue.toLocaleString()}</strong> Total Value</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Story Workflows */}
      <Tabs value={activeUserStory} onValueChange={setActiveUserStory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">📋 Overview</TabsTrigger>
          <TabsTrigger value="procurement">🛒 Procurement</TabsTrigger>
          <TabsTrigger value="finance">💰 Finance</TabsTrigger>
          <TabsTrigger value="operations">⚙️ Operations</TabsTrigger>
          <TabsTrigger value="executive">👔 Executive</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Supply Chain Triangle - Real Performance Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Processing real data...</div>
              ) : analytics.triangle ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <ScoreCard 
                    label="Service Score" 
                    value={analytics.triangle.service_score} 
                    trend={analytics.triangle.trends?.service?.trend}
                  />
                  <ScoreCard 
                    label="Cost Score" 
                    value={analytics.triangle.cost_score}
                    trend={analytics.triangle.trends?.cost?.trend}
                  />
                  <ScoreCard 
                    label="Capital Score" 
                    value={analytics.triangle.capital_score}
                    trend={analytics.triangle.trends?.capital?.trend}
                  />
                  <ScoreCard 
                    label="Overall Score" 
                    value={analytics.triangle.overall_score}
                    highlight={true}
                  />
                </div>
              ) : (
                <p>Upload data to see real triangle scores</p>
              )}
              
              {analytics.triangle?.recommendations && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">📝 Data-Driven Recommendations:</h4>
                  <ul className="space-y-1">
                    {analytics.triangle.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Procurement User Story */}
        <TabsContent value="procurement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🛒 Procurement Manager: "Which suppliers should I prioritize?"</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.supplier?.suppliers ? (
                <div className="space-y-4">
                  {analytics.supplier.suppliers.slice(0, 5).map((supplier: any) => (
                    <div key={supplier.id} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{supplier.name}</h4>
                        <Badge variant={
                          supplier.risk_level === 'low' ? 'default' : 
                          supplier.risk_level === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {supplier.risk_level.toUpperCase()} RISK
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>Health: <strong>{supplier.health_score.toFixed(1)}%</strong></div>
                        <div>Delivery: <strong>{supplier.delivery_performance.toFixed(1)}%</strong></div>
                        <div>Quality: <strong>{supplier.quality_score.toFixed(1)}%</strong></div>
                        <div>Orders: <strong>{supplier.total_orders}</strong></div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-blue-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">📈 Portfolio Performance:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>Avg Health: <strong>{analytics.supplier.average_performance.health_score.toFixed(1)}%</strong></div>
                      <div>Avg Delivery: <strong>{analytics.supplier.average_performance.delivery_performance.toFixed(1)}%</strong></div>
                      <div>Avg Quality: <strong>{analytics.supplier.average_performance.quality_score.toFixed(1)}%</strong></div>
                      <div>Cost Efficiency: <strong>{analytics.supplier.average_performance.cost_efficiency.toFixed(1)}%</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Upload supplier data to see procurement insights</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance User Story */}
        <TabsContent value="finance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>💰 Finance Manager: "Where is my cash trapped?"</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.crossReference ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard 
                      label="Order Fulfillment" 
                      value={`${analytics.crossReference.order_fulfillment_rate.toFixed(1)}%`}
                      trend={analytics.crossReference.order_fulfillment_rate > 90 ? 'good' : 'warning'}
                    />
                    <MetricCard 
                      label="Cost Variance" 
                      value={`${analytics.crossReference.cost_variance.toFixed(1)}%`}
                      trend={analytics.crossReference.cost_variance < 5 ? 'good' : 'warning'}
                    />
                    <MetricCard 
                      label="Document Compliance" 
                      value={`${analytics.crossReference.document_compliance.toFixed(1)}%`}
                      trend={analytics.crossReference.document_compliance > 95 ? 'good' : 'warning'}
                    />
                    <MetricCard 
                      label="Quality Issues" 
                      value={analytics.crossReference.quality_issues.toString()}
                      trend={analytics.crossReference.quality_issues < 5 ? 'good' : 'warning'}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">⚠️ Issues Impacting Cash Flow:</h4>
                    <div className="space-y-2">
                      {analytics.crossReference.discrepancies.map((disc: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span className="capitalize">{disc.type.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span><strong>{disc.count}</strong> occurrences</span>
                            <Badge variant={
                              disc.severity === 'low' ? 'default' :
                              disc.severity === 'medium' ? 'secondary' : 'destructive'
                            }>
                              {disc.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p>Upload financial data to see cash flow analysis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations User Story */}
        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Operations Manager: "How can I optimize my supply chain?"</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.market ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">📈 Market Segments Performance:</h4>
                    <div className="space-y-2">
                      {analytics.market.market_segments.map((segment: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded">
                          <span className="font-medium capitalize">{segment.segment}</span>
                          <div className="text-right">
                            <div className="font-bold">${segment.revenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">{segment.order_count} orders</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">🌍 Regional Performance:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analytics.market.regional_analysis.map((region: any, index: number) => (
                        <div key={index} className="p-3 border rounded">
                          <h5 className="font-medium">{region.region}</h5>
                          <div className="text-sm text-gray-600">
                            Performance: <strong>{region.performance.toFixed(1)}%</strong> | 
                            Volume: <strong>{region.volume.toLocaleString()}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analytics.market.price_trends && (
                    <div className="bg-yellow-50 p-4 rounded">
                      <h4 className="font-semibold mb-2">💲 Price Intelligence:</h4>
                      <p>Average Price: <strong>${analytics.market.price_trends.average_price.toFixed(2)}</strong></p>
                      <p>Price Volatility: <strong>{analytics.market.price_trends.price_volatility.toFixed(1)}%</strong></p>
                    </div>
                  )}
                </div>
              ) : (
                <p>Upload market data to see operations insights</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Executive User Story */}
        <TabsContent value="executive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>👔 Executive: "What's the strategic view of our supply chain?"</CardTitle>
            </CardHeader>
            <CardContent>
              {dataSummary && analytics.triangle ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{dataSummary.recordCount}</div>
                      <div className="text-sm text-blue-700">Total Transactions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">${(dataSummary.totalValue / 1000000).toFixed(1)}M</div>
                      <div className="text-sm text-green-700">Supply Chain Value</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">{dataSummary.suppliers}</div>
                      <div className="text-sm text-purple-700">Active Suppliers</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">{analytics.triangle.overall_score.toFixed(0)}%</div>
                      <div className="text-sm text-orange-700">Overall Performance</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded">
                    <h4 className="font-semibold mb-4">🎯 Strategic Recommendations:</h4>
                    <div className="space-y-2">
                      {analytics.triangle.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-blue-600 font-bold">{index + 1}.</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analytics.supplier && (
                    <div>
                      <h4 className="font-semibold mb-3">⚡ Quick Actions Required:</h4>
                      <div className="space-y-2">
                        {analytics.supplier.suppliers
                          .filter((s: any) => s.risk_level === 'high' || s.risk_level === 'critical')
                          .slice(0, 3)
                          .map((supplier: any) => (
                            <Alert key={supplier.id}>
                              <AlertDescription>
                                <strong>{supplier.name}</strong> requires attention - {supplier.risk_level} risk supplier with {supplier.delivery_performance.toFixed(1)}% delivery performance
                              </AlertDescription>
                            </Alert>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>Upload comprehensive data to see executive dashboard</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function ScoreCard({ label, value, trend, highlight = false }: { 
  label: string; 
  value: number; 
  trend?: string; 
  highlight?: boolean; 
}) {
  return (
    <div className={`p-4 rounded-lg ${highlight ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-2xl font-bold ${highlight ? 'text-blue-600' : ''}`}>
          {value.toFixed(1)}%
        </p>
        {trend && (
          <Badge variant={trend === 'improving' ? 'default' : 'secondary'}>
            {trend}
          </Badge>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend }: { 
  label: string; 
  value: string; 
  trend: 'good' | 'warning' | 'danger'; 
}) {
  return (
    <div className={`p-3 rounded border ${
      trend === 'good' ? 'bg-green-50 border-green-200' : 
      trend === 'warning' ? 'bg-yellow-50 border-yellow-200' : 
      'bg-red-50 border-red-200'
    }`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
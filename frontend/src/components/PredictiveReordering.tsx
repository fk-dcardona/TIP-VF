'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Package, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Target,
  Zap,
  ArrowRight,
  BarChart3,
  Activity,
  DollarSign,
  Truck,
  Factory,
  Shield,
  Bell,
  Lightbulb,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';

interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  recommendedQuantity: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  daysUntilStockout: number;
  leadTime: number;
  safetyStock: number;
  avgDemand: number;
  demandVariability: number;
  confidence: number;
  cost: number;
  supplier: string;
  seasonalFactor: number;
  predictedDemand: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
  riskFactors: string[];
  opportunities: string[];
}

interface InventoryAnalytics {
  totalValue: number;
  turnoverRate: number;
  stockoutRisk: number;
  overstockRisk: number;
  averageLeadTime: number;
  fillRate: number;
  optimalStock: number;
  currentStock: number;
}

interface PredictiveReorderingProps {
  data: {
    recommendations: ReorderRecommendation[];
    analytics: InventoryAnalytics;
    demandForecast: {
      productId: string;
      historical: number[];
      forecast: number[];
      confidence: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }[];
    supplierPerformance: {
      supplierId: string;
      name: string;
      avgLeadTime: number;
      reliability: number;
      qualityScore: number;
      costIndex: number;
    }[];
    marketConditions: {
      economicIndex: number;
      seasonalIndex: number;
      competitiveIndex: number;
      supplyChainDisruption: number;
    };
  };
  loading?: boolean;
}

export default function PredictiveReordering({ data, loading = false }: PredictiveReorderingProps) {
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'urgency' | 'value' | 'days'>('urgency');
  const [autoReorder, setAutoReorder] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Process and sort recommendations
  const processedRecommendations = useMemo(() => {
    let filtered = data.recommendations;
    
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(rec => rec.urgency === urgencyFilter);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        case 'value':
          return (b.recommendedQuantity * b.cost) - (a.recommendedQuantity * a.cost);
        case 'days':
          return a.daysUntilStockout - b.daysUntilStockout;
        default:
          return 0;
      }
    });
  }, [data.recommendations, urgencyFilter, sortBy]);
  
  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const critical = data.recommendations.filter(r => r.urgency === 'critical').length;
    const high = data.recommendations.filter(r => r.urgency === 'high').length;
    const totalValue = data.recommendations.reduce((sum, r) => sum + (r.recommendedQuantity * r.cost), 0);
    const avgConfidence = data.recommendations.reduce((sum, r) => sum + r.confidence, 0) / data.recommendations.length;
    
    return { critical, high, totalValue, avgConfidence };
  }, [data.recommendations]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      default:
        return 'text-blue-700 bg-blue-100 border-blue-200';
    }
  };
  
  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return AlertTriangle;
      case 'high':
        return Clock;
      case 'medium':
        return Activity;
      default:
        return CheckCircle;
    }
  };
  
  const handleSelectItem = (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };
  
  const handleBatchAction = (action: 'approve' | 'delay' | 'modify') => {
    // Implementation for batch actions
    console.log(`Batch ${action} for items:`, Array.from(selectedItems));
    setSelectedItems(new Set());
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Brain className="h-8 w-8 mr-3" />
              AI-Powered Predictive Reordering
            </h2>
            <p className="text-purple-100">Intelligent recommendations to optimize inventory and prevent stockouts</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{data.recommendations.length}</div>
            <div className="text-purple-200">Active Recommendations</div>
            <div className="text-sm text-purple-300 mt-1">
              {summaryMetrics.avgConfidence.toFixed(0)}% avg confidence
            </div>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-purple-200 text-sm">Critical Items</p>
            <p className="text-xl font-bold">{summaryMetrics.critical}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-purple-200 text-sm">High Priority</p>
            <p className="text-xl font-bold">{summaryMetrics.high}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-purple-200 text-sm">Reorder Value</p>
            <p className="text-xl font-bold">{formatCurrency(summaryMetrics.totalValue)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-purple-200 text-sm">Fill Rate</p>
            <p className="text-xl font-bold">{(data.analytics.fillRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reorder Management</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant={batchMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBatchMode(!batchMode)}
            >
              Batch Mode
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Refresh recommendations */}}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Urgency</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="urgency">Urgency</option>
              <option value="value">Order Value</option>
              <option value="days">Days Until Stockout</option>
            </select>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoReorder}
              onChange={(e) => setAutoReorder(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Auto-approve low-risk orders</span>
          </label>
        </div>
        
        {/* Batch Actions */}
        {batchMode && selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedItems.size} items selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleBatchAction('approve')}>
                  Approve All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBatchAction('delay')}>
                  Delay All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBatchAction('modify')}>
                  Modify All
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommendations" className="space-y-4">
          {/* Recommendation Cards */}
          <div className="space-y-4">
            {processedRecommendations.map((recommendation) => {
              const UrgencyIcon = getUrgencyIcon(recommendation.urgency);
              const orderValue = recommendation.recommendedQuantity * recommendation.cost;
              
              return (
                <motion.div
                  key={recommendation.productId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`p-6 transition-all ${
                    selectedProduct === recommendation.productId ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                  } ${recommendation.urgency === 'critical' ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {batchMode && (
                          <input
                            type="checkbox"
                            checked={selectedItems.has(recommendation.productId)}
                            onChange={() => handleSelectItem(recommendation.productId)}
                            className="rounded"
                          />
                        )}
                        
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{recommendation.productName}</h3>
                            <p className="text-sm text-gray-600">{recommendation.productId}</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-center px-3 py-1 rounded-full border ${getUrgencyColor(recommendation.urgency)}`}>
                          <UrgencyIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium capitalize">{recommendation.urgency}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Days Until Stockout</p>
                          <p className={`text-lg font-bold ${
                            recommendation.daysUntilStockout <= 7 ? 'text-red-600' :
                            recommendation.daysUntilStockout <= 14 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {recommendation.daysUntilStockout}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Recommended Quantity</p>
                          <p className="text-lg font-bold text-gray-900">
                            {recommendation.recommendedQuantity.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Order Value</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(orderValue)}</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedProduct(
                              selectedProduct === recommendation.productId ? null : recommendation.productId
                            )}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats Row */}
                    <div className="mt-4 grid grid-cols-6 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Current Stock</p>
                        <p className="font-medium text-gray-900">{recommendation.currentStock}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Reorder Point</p>
                        <p className="font-medium text-gray-900">{recommendation.reorderPoint}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Lead Time</p>
                        <p className="font-medium text-gray-900">{recommendation.leadTime}d</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Avg Demand</p>
                        <p className="font-medium text-gray-900">{recommendation.avgDemand}/day</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Confidence</p>
                        <p className={`font-medium ${
                          recommendation.confidence >= 80 ? 'text-green-600' :
                          recommendation.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {recommendation.confidence}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Supplier</p>
                        <p className="font-medium text-gray-900 truncate">{recommendation.supplier}</p>
                      </div>
                    </div>
                    
                    {/* Detailed Analysis */}
                    <AnimatePresence>
                      {selectedProduct === recommendation.productId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 pt-6 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Demand Prediction */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                                4-Week Demand Prediction
                              </h4>
                              <div className="space-y-2">
                                {Object.entries(recommendation.predictedDemand).map(([week, demand], index) => (
                                  <div key={week} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-600">Week {index + 1}</span>
                                    <span className="font-medium text-gray-900">{demand} units</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Risk Factors & Opportunities */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                                  Risk Factors
                                </h4>
                                <ul className="space-y-1">
                                  {recommendation.riskFactors.map((risk, index) => (
                                    <li key={index} className="text-sm text-red-600 flex items-start">
                                      <ArrowRight className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                                      {risk}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <Lightbulb className="h-4 w-4 mr-2 text-green-500" />
                                  Opportunities
                                </h4>
                                <ul className="space-y-1">
                                  {recommendation.opportunities.map((opportunity, index) => (
                                    <li key={index} className="text-sm text-green-600 flex items-start">
                                      <ArrowRight className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                                      {opportunity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="mt-6 flex justify-center space-x-3">
                            <Button className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Order
                            </Button>
                            <Button variant="outline">
                              <Clock className="h-4 w-4 mr-2" />
                              Delay 1 Week
                            </Button>
                            <Button variant="outline">
                              <Target className="h-4 w-4 mr-2" />
                              Modify Quantity
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          {/* Inventory Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-green-500" />
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Inventory Value
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.analytics.totalValue)}</p>
              <p className="text-sm text-gray-600">Total inventory value</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-6 w-6 text-blue-500" />
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Turnover
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.analytics.turnoverRate.toFixed(1)}x</p>
              <p className="text-sm text-gray-600">Annual turnover rate</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  Stockout Risk
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{(data.analytics.stockoutRisk * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Probability next 30 days</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-6 w-6 text-purple-500" />
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Lead Time
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.analytics.averageLeadTime.toFixed(0)} days</p>
              <p className="text-sm text-gray-600">Average supplier lead time</p>
            </Card>
          </div>
          
          {/* Performance Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Optimization Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Stock Level Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Stock Level</span>
                    <span className="font-medium">{formatCurrency(data.analytics.currentStock)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Optimal Stock Level</span>
                    <span className="font-medium">{formatCurrency(data.analytics.optimalStock)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Variance</span>
                    <span className={`font-medium ${
                      data.analytics.currentStock > data.analytics.optimalStock ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(Math.abs(data.analytics.currentStock - data.analytics.optimalStock))}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Service Level Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fill Rate</span>
                    <span className="font-medium">{(data.analytics.fillRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overstock Risk</span>
                    <span className="font-medium">{(data.analytics.overstockRisk * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target Fill Rate</span>
                    <span className="font-medium text-green-600">95.0%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="forecast" className="space-y-6">
          {/* Demand Forecast Visualization */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecast Analysis</h3>
            
            {/* Forecast Chart Placeholder */}
            <div className="bg-gray-50 rounded-lg p-8 mb-6">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Demand forecasting visualization</p>
                <p className="text-sm">(Interactive chart would be implemented here)</p>
              </div>
            </div>
            
            {/* Product Forecast Details */}
            <div className="space-y-4">
              {data.demandForecast.slice(0, 5).map((forecast, index) => (
                <div key={forecast.productId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{forecast.productId}</h4>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        forecast.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                        forecast.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {forecast.trend === 'increasing' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {forecast.trend === 'decreasing' && <TrendingDown className="h-3 w-3 mr-1" />}
                        {forecast.trend === 'stable' && <Activity className="h-3 w-3 mr-1" />}
                        {forecast.trend}
                      </span>
                      <span className="text-sm text-gray-600">{forecast.confidence}% confidence</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Historical Avg</p>
                      <p className="font-medium">
                        {(forecast.historical.reduce((a, b) => a + b, 0) / forecast.historical.length).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Forecast Avg</p>
                      <p className="font-medium">
                        {(forecast.forecast.reduce((a, b) => a + b, 0) / forecast.forecast.length).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Min Forecast</p>
                      <p className="font-medium">{Math.min(...forecast.forecast)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Max Forecast</p>
                      <p className="font-medium">{Math.max(...forecast.forecast)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Variability</p>
                      <p className="font-medium">
                        {(Math.max(...forecast.forecast) - Math.min(...forecast.forecast)).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Trend Strength</p>
                      <p className="font-medium">{forecast.confidence}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="optimization" className="space-y-6">
          {/* AI Optimization Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              AI Optimization Recommendations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Inventory Reduction Opportunity</h4>
                  <p className="text-sm text-green-700 mb-2">
                    Reduce inventory by {formatCurrency(500000)} while maintaining 95% service level
                  </p>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li>• Optimize safety stock calculations</li>
                    <li>• Improve demand forecasting accuracy</li>
                    <li>• Negotiate shorter lead times with key suppliers</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Supplier Diversification</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Add backup suppliers for 15 critical items to reduce risk
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• Identify single-source dependencies</li>
                    <li>• Qualify alternative suppliers</li>
                    <li>• Implement dual-source strategies</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Lead Time Optimization</h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Reduce average lead time by 3.2 days through supplier optimization
                  </p>
                  <ul className="text-xs text-yellow-600 space-y-1">
                    <li>• Renegotiate delivery terms</li>
                    <li>• Implement vendor-managed inventory</li>
                    <li>• Consider regional suppliers</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Demand Sensing</h4>
                  <p className="text-sm text-purple-700 mb-2">
                    Improve forecast accuracy by 12% with external data integration
                  </p>
                  <ul className="text-xs text-purple-600 space-y-1">
                    <li>• Integrate market data feeds</li>
                    <li>• Add weather pattern analysis</li>
                    <li>• Include economic indicators</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Market Conditions Impact */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Conditions Impact</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {data.marketConditions.economicIndex.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Economic Index</p>
                <p className="text-xs text-gray-500 mt-1">Above average growth</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {data.marketConditions.seasonalIndex.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Seasonal Index</p>
                <p className="text-xs text-gray-500 mt-1">Peak season approaching</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {data.marketConditions.competitiveIndex.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Competitive Index</p>
                <p className="text-xs text-gray-500 mt-1">Moderate competition</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {data.marketConditions.supplyChainDisruption.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Disruption Risk</p>
                <p className="text-xs text-gray-500 mt-1">Low risk environment</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
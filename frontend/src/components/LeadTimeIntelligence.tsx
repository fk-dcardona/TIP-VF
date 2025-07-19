'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Target,
  BarChart3,
  Activity,
  Package,
  Truck,
  Factory,
  MapPin,
  Zap,
  Brain,
  Eye,
  RefreshCw,
  Filter,
  ArrowRight,
  Lightbulb,
  Shield,
  DollarSign,
  Percent,
  Globe,
  Users,
  Settings,
  Bell,
  Info
} from 'lucide-react';

interface LeadTimeData {
  productId: string;
  productName: string;
  category: string;
  supplierId: string;
  supplierName: string;
  supplierLocation: string;
  currentLeadTime: number;
  historicalLeadTime: number[];
  periods: string[];
  averageLeadTime: number;
  minLeadTime: number;
  maxLeadTime: number;
  variance: number;
  reliability: number; // percentage
  trend: 'improving' | 'stable' | 'deteriorating';
  seasonalPatterns: {
    month: number;
    averageLeadTime: number;
    orderVolume: number;
  }[];
  factors: {
    geographic: number; // distance factor
    complexity: number; // product complexity
    volume: number; // order volume impact
    supplier: number; // supplier capacity
    market: number; // market conditions
  };
  predictions: {
    nextMonth: number;
    confidence: number;
    factors: string[];
    risks: string[];
  };
  optimization: {
    recommendations: string[];
    potentialImprovement: number;
    cost: number;
    effort: 'low' | 'medium' | 'high';
  };
}

interface SupplierLeadTimeProfile {
  supplierId: string;
  supplierName: string;
  location: string;
  category: string;
  overallLeadTime: number;
  reliability: number;
  products: number;
  onTimeDelivery: number;
  averageDelay: number;
  performanceTrend: 'improving' | 'stable' | 'deteriorating';
  riskLevel: 'low' | 'medium' | 'high';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface LeadTimeIntelligenceProps {
  data: {
    leadTimes: LeadTimeData[];
    suppliers: SupplierLeadTimeProfile[];
    benchmarks: {
      industryAverage: number;
      bestInClass: number;
      targetLeadTime: number;
    };
    analytics: {
      averageLeadTime: number;
      totalVariance: number;
      reliabilityScore: number;
      onTimePerformance: number;
      costOfDelay: number;
      improvementOpportunity: number;
    };
    disruptions: {
      id: string;
      type: 'weather' | 'transport' | 'supplier' | 'demand' | 'geopolitical';
      severity: 'low' | 'medium' | 'high' | 'critical';
      affectedSuppliers: string[];
      estimatedDelay: number;
      description: string;
      startDate: string;
      estimatedDuration: number;
      mitigation: string[];
    }[];
  };
  loading?: boolean;
}

export default function LeadTimeIntelligence({ data, loading = false }: LeadTimeIntelligenceProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'products' | 'suppliers'>('products');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'leadtime' | 'variance' | 'reliability'>('leadtime');
  const [timeHorizon, setTimeHorizon] = useState<'1month' | '3month' | '6month'>('3month');
  
  // Process and sort lead time data
  const processedData = useMemo(() => {
    let filtered = data.leadTimes;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'leadtime':
          return b.currentLeadTime - a.currentLeadTime;
        case 'variance':
          return b.variance - a.variance;
        case 'reliability':
          return a.reliability - b.reliability; // Lower reliability first
        default:
          return 0;
      }
    });
  }, [data.leadTimes, filterCategory, sortBy]);
  
  // Calculate summary insights
  const insights = useMemo(() => {
    const totalProducts = data.leadTimes.length;
    const longLeadTimeProducts = data.leadTimes.filter(p => p.currentLeadTime > data.benchmarks.targetLeadTime).length;
    const unreliableProducts = data.leadTimes.filter(p => p.reliability < 80).length;
    const improvingTrends = data.leadTimes.filter(p => p.trend === 'improving').length;
    const deterioratingTrends = data.leadTimes.filter(p => p.trend === 'deteriorating').length;
    
    return {
      totalProducts,
      longLeadTimeProducts,
      unreliableProducts,
      improvingTrends,
      deterioratingTrends,
      percentageOverTarget: (longLeadTimeProducts / totalProducts) * 100,
      avgImprovement: data.leadTimes.reduce((sum, p) => sum + p.optimization.potentialImprovement, 0) / totalProducts
    };
  }, [data]);
  
  const formatDays = (days: number) => {
    if (days === 1) return '1 day';
    return `${days.toFixed(0)} days`;
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-100';
      case 'deteriorating':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return TrendingUp;
      case 'deteriorating':
        return TrendingDown;
      default:
        return Activity;
    }
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };
  
  const getDisruptionColor = (severity: string) => {
    switch (severity) {
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
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Clock className="h-8 w-8 mr-3" />
              Lead Time Intelligence
            </h2>
            <p className="text-teal-100">AI-powered lead time analysis and optimization</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatDays(data.analytics.averageLeadTime)}</div>
            <div className="text-teal-200">Average Lead Time</div>
            <div className="text-sm text-teal-300 mt-1">
              {data.analytics.onTimePerformance.toFixed(1)}% on-time delivery
            </div>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-teal-200 text-sm">Products Tracked</p>
            <p className="text-xl font-bold">{insights.totalProducts}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-teal-200 text-sm">Over Target</p>
            <p className="text-xl font-bold">{insights.percentageOverTarget.toFixed(0)}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-teal-200 text-sm">Reliability Score</p>
            <p className="text-xl font-bold">{data.analytics.reliabilityScore.toFixed(1)}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-teal-200 text-sm">Cost of Delays</p>
            <p className="text-xl font-bold">{formatCurrency(data.analytics.costOfDelay)}</p>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Controls</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('products')}
            >
              <Package className="h-4 w-4 mr-2" />
              Products
            </Button>
            <Button
              variant={viewMode === 'suppliers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('suppliers')}
            >
              <Factory className="h-4 w-4 mr-2" />
              Suppliers
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(data.leadTimes.map(p => p.category))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="leadtime">Lead Time</option>
              <option value="variance">Variance</option>
              <option value="reliability">Reliability</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Horizon:</span>
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="1month">1 Month</option>
              <option value="3month">3 Months</option>
              <option value="6month">6 Months</option>
            </select>
          </div>
        </div>
      </Card>
      
      {/* Active Disruptions Alert */}
      {data.disruptions.length > 0 && (
        <Card className="p-4 border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="font-medium text-red-900">Active Disruptions</h3>
                <p className="text-sm text-red-700">
                  {data.disruptions.length} disruption(s) affecting lead times
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </Card>
      )}
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="disruptions">Disruptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-6 w-6 text-blue-500" />
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Benchmark
                </span>
              </div>
              <p className="text-sm text-blue-700">Industry Average</p>
              <p className="text-2xl font-bold text-blue-900">{formatDays(data.benchmarks.industryAverage)}</p>
              <p className="text-xs text-blue-600 mt-1">
                Target: {formatDays(data.benchmarks.targetLeadTime)}
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-6 w-6 text-green-500" />
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Variance
                </span>
              </div>
              <p className="text-sm text-green-700">Total Variance</p>
              <p className="text-2xl font-bold text-green-900">{data.analytics.totalVariance.toFixed(1)} days</p>
              <p className="text-xs text-green-600 mt-1">Across all products</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-6 w-6 text-purple-500" />
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Performance
                </span>
              </div>
              <p className="text-sm text-purple-700">On-Time Delivery</p>
              <p className="text-2xl font-bold text-purple-900">{data.analytics.onTimePerformance.toFixed(1)}%</p>
              <p className="text-xs text-purple-600 mt-1">Past 90 days</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-orange-500" />
                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  Impact
                </span>
              </div>
              <p className="text-sm text-orange-700">Improvement Potential</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(data.analytics.improvementOpportunity)}
              </p>
              <p className="text-xs text-orange-600 mt-1">Annual savings</p>
            </Card>
          </div>
          
          {/* Lead Time Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Time Distribution</h3>
            <div className="bg-gray-50 rounded-lg p-8 mb-4">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Lead time distribution visualization</p>
                <p className="text-sm">(Histogram chart would be implemented here)</p>
              </div>
            </div>
            
            {/* Distribution Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { range: '< 7 days', count: data.leadTimes.filter(p => p.currentLeadTime < 7).length, color: 'bg-green-500' },
                { range: '7-14 days', count: data.leadTimes.filter(p => p.currentLeadTime >= 7 && p.currentLeadTime < 14).length, color: 'bg-blue-500' },
                { range: '14-30 days', count: data.leadTimes.filter(p => p.currentLeadTime >= 14 && p.currentLeadTime < 30).length, color: 'bg-yellow-500' },
                { range: '> 30 days', count: data.leadTimes.filter(p => p.currentLeadTime >= 30).length, color: 'bg-red-500' }
              ].map((item) => (
                <div key={item.range} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`w-4 h-4 ${item.color} rounded mx-auto mb-2`}></div>
                  <p className="text-sm font-medium text-gray-900">{item.range}</p>
                  <p className="text-xs text-gray-600">{item.count} products</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-6">
          {viewMode === 'products' ? (
            /* Product Analysis */
            <div className="space-y-4">
              {processedData.map((product) => {
                const TrendIcon = getTrendIcon(product.trend);
                
                return (
                  <motion.div
                    key={product.productId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`p-6 cursor-pointer transition-all ${
                      selectedProduct === product.productId ? 'ring-2 ring-teal-500 bg-teal-50' : ''
                    }`}
                    onClick={() => setSelectedProduct(
                      selectedProduct === product.productId ? null : product.productId
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{product.productName}</h3>
                            <p className="text-sm text-gray-600">{product.category} • {product.supplierName}</p>
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {product.supplierLocation}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Current Lead Time</p>
                            <p className={`text-lg font-bold ${
                              product.currentLeadTime > data.benchmarks.targetLeadTime ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatDays(product.currentLeadTime)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Reliability</p>
                            <p className={`text-lg font-bold ${
                              product.reliability >= 90 ? 'text-green-600' :
                              product.reliability >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {product.reliability.toFixed(0)}%
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Variance</p>
                            <p className="text-lg font-bold text-gray-900">{product.variance.toFixed(1)} days</p>
                          </div>
                          
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(product.trend)}`}>
                              <TrendIcon className="h-4 w-4 mr-1" />
                              {product.trend}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="mt-4 grid grid-cols-5 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Historical Avg</p>
                          <p className="font-medium text-gray-900">{formatDays(product.averageLeadTime)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Min/Max</p>
                          <p className="font-medium text-gray-900">
                            {formatDays(product.minLeadTime)}/{formatDays(product.maxLeadTime)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Next Prediction</p>
                          <p className="font-medium text-gray-900">{formatDays(product.predictions.nextMonth)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Confidence</p>
                          <p className="font-medium text-gray-900">{product.predictions.confidence}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Improvement</p>
                          <p className="font-medium text-green-600">-{product.optimization.potentialImprovement} days</p>
                        </div>
                      </div>
                      
                      {/* Detailed Analysis */}
                      <AnimatePresence>
                        {selectedProduct === product.productId && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 pt-6 border-t border-gray-200"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Contributing Factors */}
                              <div>
                                <h4 className="font-medium text-gray-900 mb-3">Contributing Factors</h4>
                                <div className="space-y-2">
                                  {Object.entries(product.factors).map(([factor, impact]) => (
                                    <div key={factor} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <span className="text-sm text-gray-700 capitalize">{factor}</span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {(impact * 100).toFixed(0)}% impact
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Optimization Recommendations */}
                              <div>
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                                  Optimization Opportunities
                                </h4>
                                <ul className="space-y-2">
                                  {product.optimization.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-gray-700 flex items-start">
                                      <ArrowRight className="h-4 w-4 mr-2 text-teal-500 flex-shrink-0 mt-0.5" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                  <p className="text-sm text-green-800">
                                    <span className="font-medium">Potential improvement:</span> {product.optimization.potentialImprovement} days
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Implementation effort: {product.optimization.effort}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Supplier Analysis */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.suppliers.map((supplier) => (
                <Card key={supplier.supplierId} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.supplierName}</h3>
                      <p className="text-sm text-gray-600">{supplier.category}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {supplier.location}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(supplier.riskLevel)}`}>
                      {supplier.riskLevel} risk
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Lead Time</span>
                      <span className="font-medium">{formatDays(supplier.overallLeadTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Reliability</span>
                      <span className="font-medium">{supplier.reliability.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">On-Time Delivery</span>
                      <span className="font-medium">{supplier.onTimeDelivery.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Products</span>
                      <span className="font-medium">{supplier.products}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Performance Trend</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(supplier.performanceTrend)}`}>
                        {supplier.performanceTrend}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="predictions" className="space-y-6">
          {/* AI Predictions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-500" />
              AI-Powered Lead Time Predictions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedData.slice(0, 6).map((product) => (
                <div key={product.productId} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{product.productName}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current</span>
                      <span className="font-medium">{formatDays(product.currentLeadTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Predicted</span>
                      <span className={`font-medium ${
                        product.predictions.nextMonth < product.currentLeadTime ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatDays(product.predictions.nextMonth)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className="font-medium">{product.predictions.confidence}%</span>
                    </div>
                  </div>
                  
                  {product.predictions.risks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Key Risks:</p>
                      <ul className="space-y-1">
                        {product.predictions.risks.slice(0, 2).map((risk, index) => (
                          <li key={index} className="text-xs text-gray-600">• {risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="optimization" className="space-y-6">
          {/* Optimization Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Wins</h3>
              <div className="space-y-4">
                {data.leadTimes
                  .filter(p => p.optimization.effort === 'low' && p.optimization.potentialImprovement > 2)
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-600">{product.optimization.recommendations[0]}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          -{product.optimization.potentialImprovement} days
                        </p>
                        <p className="text-xs text-gray-500">Low effort</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">High Impact Opportunities</h3>
              <div className="space-y-4">
                {data.leadTimes
                  .filter(p => p.optimization.potentialImprovement > 5)
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-600">{product.optimization.recommendations[0]}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          -{product.optimization.potentialImprovement} days
                        </p>
                        <p className="text-xs text-gray-500">{product.optimization.effort} effort</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
          
          {/* Optimization Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Impact Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {insights.avgImprovement.toFixed(1)} days
                </p>
                <p className="text-sm text-green-700">Average improvement potential</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.analytics.improvementOpportunity)}
                </p>
                <p className="text-sm text-blue-700">Annual cost savings</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {data.leadTimes.filter(p => p.optimization.effort === 'low').length}
                </p>
                <p className="text-sm text-purple-700">Quick wins available</p>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="disruptions" className="space-y-6">
          {/* Active Disruptions */}
          <div className="space-y-4">
            {data.disruptions.map((disruption) => (
              <Card key={disruption.id} className={`p-6 border-l-4 ${
                disruption.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                disruption.severity === 'high' ? 'border-l-orange-500 bg-orange-50' :
                disruption.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{disruption.type} Disruption</h3>
                    <p className="text-sm text-gray-600">{disruption.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDisruptionColor(disruption.severity)}`}>
                      {disruption.severity}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">+{disruption.estimatedDelay} days delay</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Affected Suppliers</h4>
                    <div className="space-y-1">
                      {disruption.affectedSuppliers.slice(0, 3).map((supplierId) => {
                        const supplier = data.suppliers.find(s => s.supplierId === supplierId);
                        return (
                          <p key={supplierId} className="text-sm text-gray-600">
                            • {supplier?.supplierName || supplierId}
                          </p>
                        );
                      })}
                      {disruption.affectedSuppliers.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{disruption.affectedSuppliers.length - 3} more suppliers
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Mitigation Actions</h4>
                    <ul className="space-y-1">
                      {disruption.mitigation.slice(0, 3).map((action, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500 flex-shrink-0 mt-0.5" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Duration: {disruption.estimatedDuration} days</span>
                    <span>Started: {disruption.startDate}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {data.disruptions.length === 0 && (
            <Card className="p-8 text-center">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Disruptions</h3>
              <p className="text-gray-600">All supply chain routes are operating normally</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
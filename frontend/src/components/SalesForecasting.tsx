'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  BarChart3, 
  LineChart,
  DollarSign, 
  Percent,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Package,
  ArrowRight,
  Brain,
  Zap,
  Settings,
  Eye,
  RefreshCw
} from 'lucide-react';

interface HistoricalData {
  period: string;
  revenue: number;
  units: number;
  averagePrice: number;
  newCustomers: number;
  seasonalIndex: number;
}

interface ProductForecast {
  productId: string;
  productName: string;
  currentRevenue: number;
  forecastRevenue: number;
  currentUnits: number;
  forecastUnits: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: {
    seasonal: number;
    trend: number;
    market: number;
    competition: number;
  };
}

interface ScenarioData {
  name: string;
  probability: number;
  revenue: number;
  growth: number;
  description: string;
  assumptions: string[];
  risks: string[];
}

interface SalesForecastingProps {
  data: {
    historical: HistoricalData[];
    currentPeriod: {
      revenue: number;
      units: number;
      customers: number;
      avgPrice: number;
    };
    productForecasts: ProductForecast[];
    seasonalPatterns: {
      month: number;
      index: number;
      description: string;
    }[];
    marketFactors: {
      economicGrowth: number;
      industryGrowth: number;
      competitiveIndex: number;
      marketSaturation: number;
    };
  };
  loading?: boolean;
}

export default function SalesForecasting({ data, loading = false }: SalesForecastingProps) {
  const [forecastPeriod, setForecastPeriod] = useState(12); // months
  const [confidenceLevel, setConfidenceLevel] = useState(80); // percentage
  const [modelType, setModelType] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [seasonalAdjustment, setSeasonalAdjustment] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  
  // Calculate base forecast using various models
  const forecast = useMemo(() => {
    const baseRevenue = data.currentPeriod.revenue;
    const historicalGrowth = data.historical.length > 1 
      ? ((data.historical[data.historical.length - 1].revenue / data.historical[0].revenue) ** (1 / (data.historical.length - 1)) - 1) * 100
      : 0;
    
    // Model adjustments
    const modelMultipliers = {
      conservative: 0.8,
      moderate: 1.0,
      aggressive: 1.3
    };
    
    const adjustedGrowth = historicalGrowth * modelMultipliers[modelType];
    const marketAdjustment = (data.marketFactors.industryGrowth + data.marketFactors.economicGrowth) / 2;
    const competitiveAdjustment = 100 - data.marketFactors.competitiveIndex;
    
    const monthlyForecasts = [];
    let runningRevenue = baseRevenue;
    
    for (let month = 1; month <= forecastPeriod; month++) {
      const growthFactor = 1 + (adjustedGrowth + marketAdjustment) / 100 / 12;
      const seasonalFactor = seasonalAdjustment 
        ? data.seasonalPatterns.find(p => p.month === ((month - 1) % 12) + 1)?.index || 1
        : 1;
      
      runningRevenue *= growthFactor;
      const adjustedRevenue = runningRevenue * seasonalFactor;
      
      monthlyForecasts.push({
        month,
        revenue: adjustedRevenue,
        confidence: Math.max(20, confidenceLevel - (month * 2)), // Confidence decreases over time
        growth: ((adjustedRevenue / baseRevenue - 1) * 100),
        seasonalFactor
      });
    }
    
    // Calculate scenarios
    const scenarios: ScenarioData[] = [
      {
        name: 'Bull Case',
        probability: 20,
        revenue: monthlyForecasts[forecastPeriod - 1].revenue * 1.3,
        growth: adjustedGrowth * 1.5 + marketAdjustment,
        description: 'Optimistic scenario with strong market conditions',
        assumptions: [
          'Above-average market growth',
          'Successful product launches',
          'Market share expansion',
          'Economic tailwinds'
        ],
        risks: [
          'Over-optimistic projections',
          'Resource constraints',
          'Competitive response'
        ]
      },
      {
        name: 'Base Case',
        probability: 60,
        revenue: monthlyForecasts[forecastPeriod - 1].revenue,
        growth: adjustedGrowth + marketAdjustment,
        description: 'Most likely scenario based on current trends',
        assumptions: [
          'Continued current performance',
          'Stable market conditions',
          'Expected seasonal patterns',
          'Normal competitive environment'
        ],
        risks: [
          'Market volatility',
          'Unexpected disruptions',
          'Customer behavior changes'
        ]
      },
      {
        name: 'Bear Case',
        probability: 20,
        revenue: monthlyForecasts[forecastPeriod - 1].revenue * 0.7,
        growth: adjustedGrowth * 0.5,
        description: 'Conservative scenario with challenging conditions',
        assumptions: [
          'Economic headwinds',
          'Increased competition',
          'Market saturation effects',
          'Conservative customer spending'
        ],
        risks: [
          'Severe market downturn',
          'Loss of key customers',
          'Competitive disruption',
          'Economic recession'
        ]
      }
    ];
    
    return {
      monthlyForecasts,
      scenarios,
      totalForecast: monthlyForecasts[forecastPeriod - 1].revenue,
      averageGrowth: adjustedGrowth + marketAdjustment,
      confidenceRange: {
        high: monthlyForecasts[forecastPeriod - 1].revenue * 1.2,
        low: monthlyForecasts[forecastPeriod - 1].revenue * 0.8
      }
    };
  }, [data, forecastPeriod, modelType, seasonalAdjustment, confidenceLevel]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600 bg-green-100';
    if (confidence >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Activity;
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">AI-Powered Sales Forecasting</h2>
            <p className="text-indigo-100">Predict future sales performance with advanced analytics</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(forecast.totalForecast)}</div>
            <div className="text-indigo-200">{forecastPeriod}-Month Forecast</div>
            <div className="text-sm text-indigo-300 mt-1">
              {formatPercent(forecast.averageGrowth)} growth
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-indigo-200 text-sm">Current Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(data.currentPeriod.revenue)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-indigo-200 text-sm">Growth Rate</p>
            <p className="text-xl font-bold">{formatPercent(forecast.averageGrowth)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-indigo-200 text-sm">Confidence</p>
            <p className="text-xl font-bold">{confidenceLevel}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-indigo-200 text-sm">Model</p>
            <p className="text-xl font-bold capitalize">{modelType}</p>
          </div>
        </div>
      </div>
      
      {/* Forecasting Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-indigo-600" />
            Forecast Parameters
          </h3>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'summary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('summary')}
            >
              Summary
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('detailed')}
            >
              Detailed
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-gray-900">Forecast Period</label>
                <span className="text-xl font-bold text-gray-900">{forecastPeriod} months</span>
              </div>
              <Slider
                value={[forecastPeriod]}
                onValueChange={(value) => setForecastPeriod(value[0])}
                min={3}
                max={36}
                step={3}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>3 months</span>
                <span>12 months</span>
                <span>24 months</span>
                <span>36 months</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-gray-900">Confidence Level</label>
                <span className="text-xl font-bold text-gray-900">{confidenceLevel}%</span>
              </div>
              <Slider
                value={[confidenceLevel]}
                onValueChange={(value) => setConfidenceLevel(value[0])}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="font-medium text-gray-900 block mb-3">Model Type</label>
              <div className="space-y-2">
                {[
                  { value: 'conservative', label: 'Conservative', desc: 'Lower risk, stable growth' },
                  { value: 'moderate', label: 'Moderate', desc: 'Balanced approach, most likely' },
                  { value: 'aggressive', label: 'Aggressive', desc: 'Higher growth, more risk' }
                ].map((model) => (
                  <label key={model.value} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="modelType"
                      value={model.value}
                      checked={modelType === model.value}
                      onChange={(e) => setModelType(e.target.value as any)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{model.label}</p>
                      <p className="text-sm text-gray-600">{model.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={seasonalAdjustment}
                  onChange={(e) => setSeasonalAdjustment(e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium text-gray-900">Apply Seasonal Adjustments</span>
              </label>
              <p className="text-sm text-gray-600 mt-1">Include historical seasonal patterns in forecast</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Forecast Results */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Forecast Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 border-2 border-green-200 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-6 w-6 text-green-600" />
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Base Case
                </span>
              </div>
              <p className="text-sm text-green-700">Forecast Revenue</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(forecast.totalForecast)}</p>
              <p className="text-sm text-green-600 mt-1">
                {formatPercent(forecast.averageGrowth)} growth rate
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Upside
                </span>
              </div>
              <p className="text-sm text-blue-700">High Confidence</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(forecast.confidenceRange.high)}</p>
              <p className="text-sm text-blue-600 mt-1">
                +{formatPercent(((forecast.confidenceRange.high / forecast.totalForecast) - 1) * 100)}
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="h-6 w-6 text-orange-600" />
                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  Downside
                </span>
              </div>
              <p className="text-sm text-orange-700">Low Confidence</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(forecast.confidenceRange.low)}</p>
              <p className="text-sm text-orange-600 mt-1">
                {formatPercent(((forecast.confidenceRange.low / forecast.totalForecast) - 1) * 100)}
              </p>
            </Card>
          </div>
          
          {/* Monthly Forecast Chart Placeholder */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Forecast Trend</h3>
            <div className="bg-gray-50 rounded-lg p-8 mb-4">
              <div className="text-center text-gray-500">
                <LineChart className="h-12 w-12 mx-auto mb-2" />
                <p>Monthly forecast visualization</p>
                <p className="text-sm">(Interactive chart would be implemented here)</p>
              </div>
            </div>
            
            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start">
                  <Brain className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">AI Insight</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Model predicts {forecast.averageGrowth > 0 ? 'accelerating' : 'declining'} growth 
                      driven by {forecast.averageGrowth > 0 ? 'favorable market conditions' : 'market headwinds'}.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900">Key Risk</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Forecast confidence decreases after month {Math.floor(forecastPeriod / 2)}. 
                      Consider shorter forecasting periods for higher accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="scenarios" className="space-y-6">
          {/* Scenario Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {forecast.scenarios.map((scenario, index) => (
              <Card key={index} className={`p-6 ${
                scenario.name === 'Base Case' ? 'border-2 border-blue-500 bg-blue-50' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    scenario.probability >= 50 ? 'bg-green-100 text-green-800' :
                    scenario.probability >= 30 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {scenario.probability}% likely
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Revenue Forecast</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(scenario.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className={`text-lg font-semibold ${scenario.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(scenario.growth)}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Key Assumptions</h4>
                    <ul className="space-y-1">
                      {scenario.assumptions.slice(0, 2).map((assumption, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500 flex-shrink-0 mt-0.5" />
                          {assumption}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Key Risks</h4>
                    <ul className="space-y-1">
                      {scenario.risks.slice(0, 2).map((risk, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start">
                          <AlertTriangle className="h-3 w-3 mr-1 text-red-500 flex-shrink-0 mt-0.5" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          {/* Product-Level Forecasts */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Forecast Breakdown</h3>
            <div className="space-y-4">
              {data.productForecasts.map((product, index) => {
                const TrendIcon = getTrendIcon(product.trend);
                const revenueChange = ((product.forecastRevenue / product.currentRevenue) - 1) * 100;
                
                return (
                  <motion.div
                    key={product.productId}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedProduct === product.productId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedProduct(
                      selectedProduct === product.productId ? null : product.productId
                    )}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-gray-900">{product.productName}</h4>
                          <p className="text-sm text-gray-600">{product.productId}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(product.forecastRevenue)}
                          </p>
                          <p className={`text-sm flex items-center ${
                            revenueChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {formatPercent(Math.abs(revenueChange))}
                          </p>
                        </div>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getConfidenceColor(product.confidence)
                        }`}>
                          {product.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {selectedProduct === product.productId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-600">Seasonal Factor</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatPercent(product.factors.seasonal)}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-600">Trend Factor</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatPercent(product.factors.trend)}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-600">Market Factor</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatPercent(product.factors.market)}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-600">Competition</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatPercent(product.factors.competition)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="accuracy" className="space-y-6">
          {/* Model Accuracy & Validation */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Accuracy & Validation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Historical Accuracy</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">3-Month Accuracy</span>
                    <span className="font-semibold text-green-600">92%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm text-gray-700">6-Month Accuracy</span>
                    <span className="font-semibold text-yellow-600">78%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-700">12-Month Accuracy</span>
                    <span className="font-semibold text-red-600">65%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Model Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mean Absolute Error</span>
                    <span className="font-medium text-gray-900">8.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">R-Squared</span>
                    <span className="font-medium text-gray-900">0.847</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="font-medium text-gray-900">2 hours ago</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => {/* Refresh model */}}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Model
                </Button>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">Accuracy Recommendations</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Use 3-6 month forecasts for tactical planning (highest accuracy)</li>
                    <li>• Apply {confidenceLevel}% confidence intervals for risk management</li>
                    <li>• Update forecasts monthly with new data for best results</li>
                    <li>• Consider external factors during volatile market periods</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
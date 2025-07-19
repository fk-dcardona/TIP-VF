'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Package, 
  DollarSign, 
  Percent,
  BarChart3,
  PieChart,
  Activity,
  Award,
  AlertCircle,
  Info,
  MapPin,
  Calendar,
  ArrowRight,
  Eye,
  ShoppingCart
} from 'lucide-react';

interface MarketSegment {
  id: string;
  name: string;
  size: number; // Total addressable market
  growth: number; // Annual growth rate
  penetration: number; // Current market penetration %
  revenue: number; // Current revenue from segment
  potential: number; // Revenue potential
  competitors: number;
  avgPrice: number;
  customerCount: number;
  churnRate: number;
  acquisitionCost: number;
  lifetimeValue: number;
}

interface CompetitorData {
  id: string;
  name: string;
  marketShare: number;
  revenue: number;
  growth: number;
  strengths: string[];
  weaknesses: string[];
  pricing: 'lower' | 'similar' | 'higher';
  threat: 'low' | 'medium' | 'high';
}

interface MarketTrend {
  id: string;
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  description: string;
  opportunities: string[];
  risks: string[];
}

interface MarketAnalysisProps {
  data: {
    totalMarketSize: number;
    currentMarketShare: number;
    segments: MarketSegment[];
    competitors: CompetitorData[];
    trends: MarketTrend[];
    regions: {
      id: string;
      name: string;
      marketSize: number;
      penetration: number;
      growth: number;
      barriers: string[];
      opportunities: string[];
    }[];
    customerAcquisition: {
      channels: {
        name: string;
        cost: number;
        conversion: number;
        volume: number;
        roi: number;
      }[];
      funnel: {
        stage: string;
        prospects: number;
        conversion: number;
      }[];
    };
  };
  loading?: boolean;
}

export default function MarketAnalysis({ data, loading = false }: MarketAnalysisProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [timeHorizon, setTimeHorizon] = useState<'1year' | '3year' | '5year'>('3year');
  
  // Calculate market opportunities
  const marketOpportunities = useMemo(() => {
    return data.segments.map(segment => ({
      ...segment,
      opportunitySize: segment.potential - segment.revenue,
      roi: ((segment.potential - segment.revenue) / segment.acquisitionCost) * 100,
      priority: segment.size * segment.growth * (100 - segment.penetration) / 10000
    })).sort((a, b) => b.priority - a.priority);
  }, [data.segments]);
  
  // Calculate competitive positioning
  const competitivePosition = useMemo(() => {
    const ourRevenue = data.segments.reduce((sum, seg) => sum + seg.revenue, 0);
    const totalMarketRevenue = data.totalMarketSize;
    const ourShare = (ourRevenue / totalMarketRevenue) * 100;
    
    const competitorsByThreat = data.competitors.reduce((acc, comp) => {
      acc[comp.threat] = (acc[comp.threat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      ourShare,
      ourRevenue,
      totalMarketRevenue,
      competitorsByThreat,
      topCompetitors: data.competitors
        .sort((a, b) => b.marketShare - a.marketShare)
        .slice(0, 5)
    };
  }, [data]);
  
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
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
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
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Market Analysis & Intelligence</h2>
            <p className="text-emerald-100">Comprehensive market insights to drive strategic decisions</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatPercent(data.currentMarketShare)}</div>
            <div className="text-emerald-200">Market Share</div>
          </div>
        </div>
        
        {/* Key Market Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-emerald-200 text-sm">Total Market</p>
            <p className="text-xl font-bold">{formatCurrency(data.totalMarketSize)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-emerald-200 text-sm">Our Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(competitivePosition.ourRevenue)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-emerald-200 text-sm">Segments</p>
            <p className="text-xl font-bold">{data.segments.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-emerald-200 text-sm">Opportunities</p>
            <p className="text-xl font-bold">{marketOpportunities.filter(op => op.opportunitySize > 0).length}</p>
          </div>
        </div>
      </div>
      
      {/* Analysis Tabs */}
      <Tabs defaultValue="segments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="segments">Market Segments</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="geography">Geographic</TabsTrigger>
          <TabsTrigger value="acquisition">Customer Acquisition</TabsTrigger>
        </TabsList>
        
        <TabsContent value="segments" className="space-y-6">
          {/* Market Segment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketOpportunities.map((segment) => (
              <motion.div
                key={segment.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card 
                  className={`p-6 cursor-pointer transition-all ${
                    selectedSegment === segment.id ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''
                  }`}
                  onClick={() => setSelectedSegment(segment.id === selectedSegment ? null : segment.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      segment.priority > 50 ? 'bg-green-100 text-green-800' :
                      segment.priority > 25 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {segment.priority > 50 ? 'High Priority' :
                       segment.priority > 25 ? 'Medium Priority' : 'Low Priority'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Market Size</span>
                      <span className="font-medium">{formatCurrency(segment.size)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Revenue</span>
                      <span className="font-medium">{formatCurrency(segment.revenue)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Penetration</span>
                      <span className="font-medium">{formatPercent(segment.penetration)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Growth Rate</span>
                      <span className={`font-medium flex items-center ${
                        segment.growth > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {segment.growth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {formatPercent(Math.abs(segment.growth))}
                      </span>
                    </div>
                    
                    {segment.opportunitySize > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Opportunity</span>
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(segment.opportunitySize)}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(segment.revenue / segment.potential) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Detailed Segment Analysis */}
          <AnimatePresence>
            {selectedSegment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {(() => {
                  const segment = data.segments.find(s => s.id === selectedSegment);
                  if (!segment) return null;
                  
                  return (
                    <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Deep Dive: {segment.name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSegment(null)}
                        >
                          Close
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <Users className="h-5 w-5 text-blue-500 mb-2" />
                          <p className="text-sm text-gray-600">Customers</p>
                          <p className="text-xl font-bold text-gray-900">{segment.customerCount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Active customers</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <DollarSign className="h-5 w-5 text-green-500 mb-2" />
                          <p className="text-sm text-gray-600">Avg Price</p>
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(segment.avgPrice)}</p>
                          <p className="text-xs text-gray-500">Per transaction</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <Activity className="h-5 w-5 text-purple-500 mb-2" />
                          <p className="text-sm text-gray-600">Churn Rate</p>
                          <p className="text-xl font-bold text-gray-900">{formatPercent(segment.churnRate)}</p>
                          <p className="text-xs text-gray-500">Monthly churn</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <Target className="h-5 w-5 text-orange-500 mb-2" />
                          <p className="text-sm text-gray-600">LTV/CAC</p>
                          <p className="text-xl font-bold text-gray-900">
                            {(segment.lifetimeValue / segment.acquisitionCost).toFixed(1)}x
                          </p>
                          <p className="text-xs text-gray-500">Return ratio</p>
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
        
        <TabsContent value="competition" className="space-y-6">
          {/* Competitive Landscape */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Landscape</h3>
            
            {/* Market Share Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Market Share Distribution</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-emerald-500 rounded mr-3"></div>
                      <span className="font-medium text-gray-900">Our Company</span>
                    </div>
                    <span className="font-semibold text-emerald-600">
                      {formatPercent(competitivePosition.ourShare)}
                    </span>
                  </div>
                  
                  {competitivePosition.topCompetitors.map((competitor, index) => (
                    <div 
                      key={competitor.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedCompetitor(competitor.id === selectedCompetitor ? null : competitor.id)}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: `hsl(${(index + 1) * 60}, 70%, 50%)` }}
                        ></div>
                        <span className="font-medium text-gray-900">{competitor.name}</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getThreatColor(competitor.threat)}`}>
                          {competitor.threat} threat
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatPercent(competitor.marketShare)}
                        </span>
                        <div className={`text-xs flex items-center ${
                          competitor.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {competitor.growth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {formatPercent(Math.abs(competitor.growth))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Threat Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm text-red-700">High Threat</span>
                    <span className="font-medium text-red-900">
                      {competitivePosition.competitorsByThreat.high || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span className="text-sm text-yellow-700">Medium Threat</span>
                    <span className="font-medium text-yellow-900">
                      {competitivePosition.competitorsByThreat.medium || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm text-green-700">Low Threat</span>
                    <span className="font-medium text-green-900">
                      {competitivePosition.competitorsByThreat.low || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Detailed Competitor Analysis */}
          <AnimatePresence>
            {selectedCompetitor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {(() => {
                  const competitor = data.competitors.find(c => c.id === selectedCompetitor);
                  if (!competitor) return null;
                  
                  return (
                    <Card className="p-6 border-2 border-blue-200 bg-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Competitor Analysis: {competitor.name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCompetitor(null)}
                        >
                          Close
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <Award className="h-4 w-4 mr-2 text-green-600" />
                            Strengths
                          </h4>
                          <ul className="space-y-2">
                            {competitor.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                            Weaknesses
                          </h4>
                          <ul className="space-y-2">
                            {competitor.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-1 text-red-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700">{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-sm text-gray-600">Market Share</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPercent(competitor.marketShare)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-sm text-gray-600">Revenue</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(competitor.revenue)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-sm text-gray-600">Pricing</p>
                          <p className={`text-lg font-semibold ${
                            competitor.pricing === 'lower' ? 'text-red-600' :
                            competitor.pricing === 'higher' ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {competitor.pricing}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          {/* Market Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.trends.map((trend, index) => (
              <Card key={trend.id} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{trend.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(trend.impact)}`}>
                      {trend.impact}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      trend.strength === 'high' ? 'bg-red-100 text-red-800' :
                      trend.strength === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {trend.strength}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{trend.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Opportunities</h4>
                    <ul className="space-y-1">
                      {trend.opportunities.slice(0, 2).map((opp, index) => (
                        <li key={index} className="text-xs text-green-600 flex items-start">
                          <ArrowRight className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Risks</h4>
                    <ul className="space-y-1">
                      {trend.risks.slice(0, 2).map((risk, index) => (
                        <li key={index} className="text-xs text-red-600 flex items-start">
                          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Timeframe: {trend.timeframe}-term</span>
                    <Calendar className="h-3 w-3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="geography" className="space-y-6">
          {/* Geographic Market Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.regions.map((region, index) => (
              <Card key={region.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                    {region.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    region.growth > 15 ? 'bg-green-100 text-green-800' :
                    region.growth > 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {formatPercent(region.growth)} growth
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Market Size</span>
                    <span className="font-medium">{formatCurrency(region.marketSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Our Penetration</span>
                    <span className="font-medium">{formatPercent(region.penetration)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Market Barriers</h4>
                    <div className="flex flex-wrap gap-1">
                      {region.barriers.map((barrier, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                          {barrier}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Opportunities</h4>
                    <div className="flex flex-wrap gap-1">
                      {region.opportunities.map((opp, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                          {opp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="acquisition" className="space-y-6">
          {/* Customer Acquisition Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acquisition Channels</h3>
              <div className="space-y-4">
                {data.customerAcquisition.channels.map((channel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{channel.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatPercent(channel.conversion)} conversion • {channel.volume} leads/month
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(channel.cost)}</p>
                      <p className={`text-sm ${channel.roi > 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(channel.roi)} ROI
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
              <div className="space-y-3">
                {data.customerAcquisition.funnel.map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                      <span className="text-sm text-gray-600">
                        {stage.prospects.toLocaleString()} ({formatPercent(stage.conversion)})
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.conversion}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
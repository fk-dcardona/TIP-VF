'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Globe,
  Factory,
  Truck,
  Zap,
  CloudRain,
  DollarSign,
  Users,
  Package,
  Clock,
  Activity,
  Target,
  BarChart3,
  Eye,
  RefreshCw,
  Filter,
  Bell,
  Info,
  ArrowRight,
  CheckCircle,
  XCircle,
  Calendar,
  ThermometerSun,
  Building,
  Gavel,
  Wifi,
  Heart,
  TreePine,
  AlertCircle,
  Settings,
  Download,
  Plus,
  Layers
} from 'lucide-react';

interface RiskEvent {
  id: string;
  type: 'geopolitical' | 'weather' | 'economic' | 'supplier' | 'transport' | 'cyber' | 'regulatory' | 'environmental';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // probability * impact
  status: 'monitoring' | 'active' | 'mitigating' | 'resolved';
  affectedRegions: string[];
  affectedSuppliers: string[];
  affectedProducts: string[];
  startDate: string;
  estimatedDuration: number; // days
  estimatedCost: number;
  mitigationActions: {
    action: string;
    status: 'planned' | 'in_progress' | 'completed';
    assignee: string;
    deadline: string;
    effectiveness: number; // 0-100
  }[];
  trends: {
    period: string;
    probability: number;
    impact: number;
  }[];
}

interface RiskCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  riskCount: number;
  averageScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  description: string;
}

interface GeographicRisk {
  region: string;
  country: string;
  coordinates: { lat: number; lng: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryRisks: string[];
  affectedSuppliers: number;
  economicStability: number;
  politicalStability: number;
  infraStructureQuality: number;
  weatherRisk: number;
  overallScore: number;
}

interface SupplyChainNode {
  id: string;
  name: string;
  type: 'supplier' | 'manufacturer' | 'distributor' | 'customer';
  tier: number;
  location: string;
  riskScore: number;
  criticalityScore: number;
  dependencies: string[];
  alternativeSources: number;
  leadTime: number;
  contractValue: number;
  risks: {
    type: string;
    severity: string;
    description: string;
  }[];
}

interface SupplyChainRiskVisualizationProps {
  data: {
    riskEvents: RiskEvent[];
    riskCategories: RiskCategory[];
    geographicRisks: GeographicRisk[];
    supplyChainNodes: SupplyChainNode[];
    riskMetrics: {
      totalRiskScore: number;
      activeEvents: number;
      highRiskSuppliers: number;
      mitigationEffectiveness: number;
      averageImpact: number;
      trendsImproving: number;
      costOfRisk: number;
      resilience_score: number;
    };
    scenarios: {
      name: string;
      description: string;
      probability: number;
      impact: number;
      affectedNodes: string[];
      mitigationCost: number;
      potentialLoss: number;
      timeToRecover: number;
    }[];
  };
  loading?: boolean;
}

export default function SupplyChainRiskVisualization({ data, loading = false }: SupplyChainRiskVisualizationProps) {
  const [selectedRiskType, setSelectedRiskType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'heatmap' | 'network' | 'timeline'>('heatmap');
  const [riskThreshold, setRiskThreshold] = useState<number>(50);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showMitigated, setShowMitigated] = useState(false);
  const [timeHorizon, setTimeHorizon] = useState<'current' | '30days' | '90days'>('current');
  
  // Process and filter risk events
  const processedEvents = useMemo(() => {
    let filtered = data.riskEvents;
    
    if (selectedRiskType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedRiskType);
    }
    
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(event => event.affectedRegions.includes(selectedRegion));
    }
    
    if (!showMitigated) {
      filtered = filtered.filter(event => event.status !== 'resolved');
    }
    
    filtered = filtered.filter(event => event.riskScore >= riskThreshold);
    
    return filtered.sort((a, b) => b.riskScore - a.riskScore);
  }, [data.riskEvents, selectedRiskType, selectedRegion, showMitigated, riskThreshold]);
  
  // Calculate risk distribution
  const riskDistribution = useMemo(() => {
    const distribution = {
      critical: processedEvents.filter(e => e.severity === 'critical').length,
      high: processedEvents.filter(e => e.severity === 'high').length,
      medium: processedEvents.filter(e => e.severity === 'medium').length,
      low: processedEvents.filter(e => e.severity === 'low').length,
    };
    
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return {
      counts: distribution,
      percentages: {
        critical: total > 0 ? (distribution.critical / total) * 100 : 0,
        high: total > 0 ? (distribution.high / total) * 100 : 0,
        medium: total > 0 ? (distribution.medium / total) * 100 : 0,
        low: total > 0 ? (distribution.low / total) * 100 : 0,
      }
    };
  }, [processedEvents]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getRiskColor = (severity: string) => {
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-700 bg-green-100';
      case 'mitigating':
        return 'text-blue-700 bg-blue-100';
      case 'active':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };
  
  const getRiskTypeIcon = (type: string) => {
    switch (type) {
      case 'geopolitical':
        return Globe;
      case 'weather':
        return CloudRain;
      case 'economic':
        return DollarSign;
      case 'supplier':
        return Factory;
      case 'transport':
        return Truck;
      case 'cyber':
        return Wifi;
      case 'regulatory':
        return Gavel;
      case 'environmental':
        return TreePine;
      default:
        return AlertTriangle;
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return TrendingUp;
      case 'decreasing':
        return TrendingDown;
      default:
        return Activity;
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
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Shield className="h-8 w-8 mr-3" />
              Supply Chain Risk Visualization
            </h2>
            <p className="text-red-100">Real-time risk monitoring and impact assessment across your supply network</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{data.riskMetrics.totalRiskScore.toFixed(0)}</div>
            <div className="text-red-200">Total Risk Score</div>
            <div className="text-sm text-red-300 mt-1">
              {data.riskMetrics.activeEvents} active events
            </div>
          </div>
        </div>
        
        {/* Risk Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-red-200 text-sm">High Risk Suppliers</p>
            <p className="text-xl font-bold">{data.riskMetrics.highRiskSuppliers}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-red-200 text-sm">Resilience Score</p>
            <p className="text-xl font-bold">{data.riskMetrics.resilience_score.toFixed(1)}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-red-200 text-sm">Cost of Risk</p>
            <p className="text-xl font-bold">{formatCurrency(data.riskMetrics.costOfRisk)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-red-200 text-sm">Mitigation Rate</p>
            <p className="text-xl font-bold">{data.riskMetrics.mitigationEffectiveness.toFixed(1)}%</p>
          </div>
        </div>
      </div>
      
      {/* Critical Alerts */}
      {processedEvents.filter(e => e.severity === 'critical').length > 0 && (
        <Card className="p-4 border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="font-medium text-red-900">Critical Risk Alert</h3>
                <p className="text-sm text-red-700">
                  {processedEvents.filter(e => e.severity === 'critical').length} critical risk event(s) require immediate attention
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              <Bell className="h-4 w-4 mr-2" />
              View Critical Risks
            </Button>
          </div>
        </Card>
      )}
      
      {/* Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Risk Analysis Controls</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'heatmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('heatmap')}
            >
              <Layers className="h-4 w-4 mr-2" />
              Heatmap
            </Button>
            <Button
              variant={viewMode === 'network' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('network')}
            >
              <Activity className="h-4 w-4 mr-2" />
              Network
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
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
              value={selectedRiskType}
              onChange={(e) => setSelectedRiskType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Risk Types</option>
              {data.riskCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Regions</option>
              {Array.from(new Set(data.geographicRisks.map(r => r.region))).map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Threshold:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-500">{riskThreshold}%</span>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showMitigated}
              onChange={(e) => setShowMitigated(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show mitigated risks</span>
          </label>
        </div>
      </Card>
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Risk Events</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Risk Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.riskCategories.map((category) => {
              const IconComponent = category.icon;
              const TrendIcon = getTrendIcon(category.trend);
              
              return (
                <Card key={category.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <IconComponent className={`h-6 w-6 ${category.color}`} />
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      category.averageScore >= 80 ? 'bg-red-100 text-red-800' :
                      category.averageScore >= 60 ? 'bg-orange-100 text-orange-800' :
                      category.averageScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {category.averageScore.toFixed(0)} score
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Events</p>
                      <p className="text-lg font-bold text-gray-900">{category.riskCount}</p>
                    </div>
                    <div className="flex items-center">
                      <TrendIcon className={`h-4 w-4 mr-1 ${
                        category.trend === 'increasing' ? 'text-red-500' :
                        category.trend === 'decreasing' ? 'text-green-500' :
                        'text-gray-500'
                      }`} />
                      <span className={`text-sm ${
                        category.trend === 'increasing' ? 'text-red-600' :
                        category.trend === 'decreasing' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {category.trend}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {/* Risk Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">By Severity</h4>
                <div className="space-y-3">
                  {[
                    { level: 'Critical', count: riskDistribution.counts.critical, percentage: riskDistribution.percentages.critical, color: 'bg-red-500' },
                    { level: 'High', count: riskDistribution.counts.high, percentage: riskDistribution.percentages.high, color: 'bg-orange-500' },
                    { level: 'Medium', count: riskDistribution.counts.medium, percentage: riskDistribution.percentages.medium, color: 'bg-yellow-500' },
                    { level: 'Low', count: riskDistribution.counts.low, percentage: riskDistribution.percentages.low, color: 'bg-blue-500' }
                  ].map((item) => (
                    <div key={item.level} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.level}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-900 font-medium">{item.count} events</span>
                        <span className="text-xs text-gray-500 ml-2">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Risk Score Distribution</h4>
                <div className="bg-gray-50 rounded-lg p-8">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Risk distribution chart</p>
                    <p className="text-sm">(Histogram would be implemented here)</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="events" className="space-y-6">
          {/* Risk Events List */}
          <div className="space-y-4">
            {processedEvents.map((event) => {
              const RiskIcon = getRiskTypeIcon(event.type);
              
              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`p-6 cursor-pointer transition-all ${
                    selectedEvent === event.id ? 'ring-2 ring-red-500 bg-red-50' : ''
                  } ${event.severity === 'critical' ? 'border-l-4 border-l-red-500' : ''}`}
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <RiskIcon className="h-6 w-6 text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500 capitalize">{event.type}</span>
                            <span className="text-xs text-gray-500">
                              {event.affectedSuppliers.length} suppliers affected
                            </span>
                            <span className="text-xs text-gray-500">
                              {event.estimatedDuration} days duration
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Risk Score</p>
                          <p className="text-2xl font-bold text-gray-900">{event.riskScore.toFixed(0)}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Impact</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(event.estimatedCost)}</p>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(event.severity)}`}>
                            {event.severity}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Probability</p>
                        <p className="font-medium text-gray-900">{event.probability}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Impact</p>
                        <p className="font-medium text-gray-900">{event.impact}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Regions</p>
                        <p className="font-medium text-gray-900">{event.affectedRegions.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Products</p>
                        <p className="font-medium text-gray-900">{event.affectedProducts.length}</p>
                      </div>
                    </div>
                    
                    {/* Detailed Analysis */}
                    <AnimatePresence>
                      {selectedEvent === event.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 pt-6 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Affected Elements */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Affected Elements</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Regions:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {event.affectedRegions.map((region, index) => (
                                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                        {region}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Suppliers:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {event.affectedSuppliers.slice(0, 3).map((supplier, index) => (
                                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                        {supplier}
                                      </span>
                                    ))}
                                    {event.affectedSuppliers.length > 3 && (
                                      <span className="text-xs text-gray-500">
                                        +{event.affectedSuppliers.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Mitigation Actions */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Mitigation Actions</h4>
                              <div className="space-y-2">
                                {event.mitigationActions.slice(0, 3).map((action, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">{action.action}</span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      action.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {action.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                ))}
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
        </TabsContent>
        
        <TabsContent value="geographic" className="space-y-6">
          {/* Geographic Risk Map */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Risk Heatmap</h3>
            <div className="bg-gray-50 rounded-lg p-8 mb-6">
              <div className="text-center text-gray-500">
                <Globe className="h-12 w-12 mx-auto mb-2" />
                <p>Interactive global risk map</p>
                <p className="text-sm">(World map with risk overlay would be implemented here)</p>
              </div>
            </div>
            
            {/* Regional Risk Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.geographicRisks.map((risk) => (
                <div key={`${risk.region}-${risk.country}`} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{risk.country}</h4>
                      <p className="text-sm text-gray-600">{risk.region}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk.riskLevel)}`}>
                      {risk.riskLevel} risk
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overall Score</span>
                      <span className="font-medium">{risk.overallScore}/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Affected Suppliers</span>
                      <span className="font-medium">{risk.affectedSuppliers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Economic Stability</span>
                      <span className="font-medium">{risk.economicStability}/100</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Primary Risks:</p>
                    <div className="flex flex-wrap gap-1">
                      {risk.primaryRisks.map((riskType, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                          {riskType}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="network" className="space-y-6">
          {/* Supply Chain Network */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Chain Network Risk</h3>
            <div className="bg-gray-50 rounded-lg p-8 mb-6">
              <div className="text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2" />
                <p>Supply chain network visualization</p>
                <p className="text-sm">(Network diagram would be implemented here)</p>
              </div>
            </div>
            
            {/* Network Nodes */}
            <div className="space-y-4">
              {data.supplyChainNodes
                .filter(node => node.riskScore >= riskThreshold)
                .slice(0, 10)
                .map((node) => (
                  <div key={node.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        node.type === 'supplier' ? 'bg-blue-100' :
                        node.type === 'manufacturer' ? 'bg-green-100' :
                        node.type === 'distributor' ? 'bg-yellow-100' :
                        'bg-purple-100'
                      }`}>
                        {node.type === 'supplier' && <Factory className="h-4 w-4 text-blue-600" />}
                        {node.type === 'manufacturer' && <Building className="h-4 w-4 text-green-600" />}
                        {node.type === 'distributor' && <Truck className="h-4 w-4 text-yellow-600" />}
                        {node.type === 'customer' && <Users className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{node.name}</h4>
                        <p className="text-sm text-gray-600">Tier {node.tier} • {node.location}</p>
                        <p className="text-xs text-gray-500">
                          {node.alternativeSources} alternative sources
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Risk Score</p>
                        <p className="text-lg font-bold text-gray-900">{node.riskScore}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Criticality</p>
                        <p className="text-lg font-bold text-gray-900">{node.criticalityScore}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Contract Value</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(node.contractValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="scenarios" className="space-y-6">
          {/* Risk Scenarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.scenarios.map((scenario, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    scenario.probability >= 70 ? 'bg-red-100 text-red-800' :
                    scenario.probability >= 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {scenario.probability}% likely
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Potential Loss</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(scenario.potentialLoss)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mitigation Cost</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(scenario.mitigationCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Recovery Time</span>
                    <span className="font-medium text-gray-900">
                      {scenario.timeToRecover} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Affected Nodes</span>
                    <span className="font-medium text-gray-900">
                      {scenario.affectedNodes.length}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ROI of Mitigation</span>
                    <span className={`font-medium ${
                      scenario.potentialLoss > scenario.mitigationCost ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {((scenario.potentialLoss - scenario.mitigationCost) / scenario.mitigationCost * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="mitigation" className="space-y-6">
          {/* Mitigation Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Mitigations</h3>
              <div className="space-y-3">
                {data.riskEvents
                  .filter(event => event.status === 'mitigating')
                  .slice(0, 5)
                  .map((event) => (
                    <div key={event.id} className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-blue-600">
                        {event.mitigationActions.filter(a => a.status === 'completed').length}/
                        {event.mitigationActions.length} actions completed
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Planned Actions</h3>
              <div className="space-y-3">
                {data.riskEvents
                  .flatMap(event => event.mitigationActions.filter(a => a.status === 'planned'))
                  .slice(0, 5)
                  .map((action, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{action.action}</h4>
                      <p className="text-sm text-gray-600">
                        Due: {action.deadline} • {action.assignee}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Effectiveness</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {data.riskMetrics.mitigationEffectiveness.toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-600">Overall Effectiveness</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed Actions</span>
                    <span className="font-medium">
                      {data.riskEvents
                        .flatMap(e => e.mitigationActions)
                        .filter(a => a.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>In Progress</span>
                    <span className="font-medium">
                      {data.riskEvents
                        .flatMap(e => e.mitigationActions)
                        .filter(a => a.status === 'in_progress').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Planned</span>
                    <span className="font-medium">
                      {data.riskEvents
                        .flatMap(e => e.mitigationActions)
                        .filter(a => a.status === 'planned').length}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
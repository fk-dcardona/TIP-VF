'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Award,
  Target,
  BarChart3,
  Activity,
  MapPin,
  Phone,
  Mail,
  Factory,
  Truck,
  FileText,
  Star,
  AlertCircle,
  Info,
  RefreshCw,
  Filter,
  ArrowUpDown,
  Eye,
  Calendar,
  Percent,
  ThumbsUp,
  ThumbsDown,
  Zap
} from 'lucide-react';

interface SupplierMetrics {
  supplierId: string;
  name: string;
  category: string;
  location: string;
  relationship: 'strategic' | 'preferred' | 'approved' | 'probation';
  overallScore: number;
  scores: {
    quality: number;
    delivery: number;
    cost: number;
    service: number;
    financial: number;
    compliance: number;
    innovation: number;
    sustainability: number;
  };
  trends: {
    quality: 'improving' | 'stable' | 'declining';
    delivery: 'improving' | 'stable' | 'declining';
    cost: 'improving' | 'stable' | 'declining';
    overall: 'improving' | 'stable' | 'declining';
  };
  keyMetrics: {
    onTimeDelivery: number;
    qualityRating: number;
    costCompetitiveness: number;
    leadTime: number;
    defectRate: number;
    responsiveness: number;
  };
  risks: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    impact: string;
    mitigation: string[];
  };
  performance: {
    deliveryHistory: number[];
    qualityHistory: number[];
    costHistory: number[];
    periods: string[];
  };
  certifications: string[];
  contact: {
    primaryContact: string;
    email: string;
    phone: string;
    alternateContact: string;
  };
  financialHealth: {
    creditRating: string;
    paymentTerms: number;
    revenue: number;
    stability: 'excellent' | 'good' | 'fair' | 'poor';
  };
  contracts: {
    activeContracts: number;
    totalValue: number;
    renewalDate: string;
    terms: string;
  };
  recommendations: string[];
}

interface SupplierHealthScoringProps {
  data: {
    suppliers: SupplierMetrics[];
    benchmarks: {
      industryAverage: number;
      topPerformer: number;
      minimumThreshold: number;
    };
    categories: {
      name: string;
      count: number;
      avgScore: number;
      trend: 'up' | 'down' | 'stable';
    }[];
    riskSummary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    alerts: {
      id: string;
      supplierId: string;
      supplierName: string;
      type: 'quality' | 'delivery' | 'financial' | 'compliance';
      severity: 'critical' | 'high' | 'medium';
      message: string;
      date: string;
      status: 'open' | 'acknowledged' | 'resolved';
    }[];
  };
  loading?: boolean;
}

export default function SupplierHealthScoring({ data, loading = false }: SupplierHealthScoringProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'risk' | 'value'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Process and filter suppliers
  const processedSuppliers = useMemo(() => {
    let filtered = data.suppliers;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(supplier => supplier.category === filterCategory);
    }
    
    if (filterRisk !== 'all') {
      filtered = filtered.filter(supplier => supplier.risks.level === filterRisk);
    }
    
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'score':
          aValue = a.overallScore;
          bValue = b.overallScore;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'risk':
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = riskOrder[a.risks.level];
          bValue = riskOrder[b.risks.level];
          break;
        case 'value':
          aValue = a.contracts.totalValue;
          bValue = b.contracts.totalValue;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data.suppliers, filterCategory, filterRisk, sortBy, sortDirection]);
  
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const avgScore = data.suppliers.reduce((sum, s) => sum + s.overallScore, 0) / data.suppliers.length;
    const topPerformers = data.suppliers.filter(s => s.overallScore >= 90).length;
    const atRisk = data.suppliers.filter(s => s.risks.level === 'high' || s.risks.level === 'critical').length;
    const strategic = data.suppliers.filter(s => s.relationship === 'strategic').length;
    
    return { avgScore, topPerformers, atRisk, strategic };
  }, [data.suppliers]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      default:
        return 'text-green-700 bg-green-100 border-green-200';
    }
  };
  
  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'strategic':
        return 'text-purple-700 bg-purple-100';
      case 'preferred':
        return 'text-blue-700 bg-blue-100';
      case 'approved':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-red-700 bg-red-100';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return TrendingUp;
      case 'declining':
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Heart className="h-8 w-8 mr-3" />
              Supplier Health Scoring
            </h2>
            <p className="text-blue-100">Comprehensive supplier performance monitoring and risk assessment</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{summaryStats.avgScore.toFixed(1)}</div>
            <div className="text-blue-200">Average Score</div>
            <div className="text-sm text-blue-300 mt-1">
              {data.suppliers.length} suppliers tracked
            </div>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-blue-200 text-sm">Top Performers</p>
            <p className="text-xl font-bold">{summaryStats.topPerformers}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-blue-200 text-sm">Strategic Partners</p>
            <p className="text-xl font-bold">{summaryStats.strategic}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-blue-200 text-sm">At Risk</p>
            <p className="text-xl font-bold">{summaryStats.atRisk}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-blue-200 text-sm">Active Alerts</p>
            <p className="text-xl font-bold">{data.alerts.filter(a => a.status === 'open').length}</p>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Supplier Management</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
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
              {data.categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Risk:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="score">Score</option>
              <option value="name">Name</option>
              <option value="risk">Risk Level</option>
              <option value="value">Contract Value</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Score Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
              <div className="space-y-4">
                {[
                  { range: '90-100', label: 'Excellent', count: data.suppliers.filter(s => s.overallScore >= 90).length, color: 'bg-green-500' },
                  { range: '80-89', label: 'Good', count: data.suppliers.filter(s => s.overallScore >= 80 && s.overallScore < 90).length, color: 'bg-blue-500' },
                  { range: '70-79', label: 'Fair', count: data.suppliers.filter(s => s.overallScore >= 70 && s.overallScore < 80).length, color: 'bg-yellow-500' },
                  { range: '60-69', label: 'Poor', count: data.suppliers.filter(s => s.overallScore >= 60 && s.overallScore < 70).length, color: 'bg-orange-500' },
                  { range: '0-59', label: 'Critical', count: data.suppliers.filter(s => s.overallScore < 60).length, color: 'bg-red-500' }
                ].map((item) => (
                  <div key={item.range} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.label} ({item.range})</span>
                    </div>
                    <span className="text-sm text-gray-600">{item.count} suppliers</span>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Summary</h3>
              <div className="space-y-4">
                {[
                  { level: 'Critical', count: data.riskSummary.critical, color: 'text-red-600 bg-red-100' },
                  { level: 'High', count: data.riskSummary.high, color: 'text-orange-600 bg-orange-100' },
                  { level: 'Medium', count: data.riskSummary.medium, color: 'text-yellow-600 bg-yellow-100' },
                  { level: 'Low', count: data.riskSummary.low, color: 'text-green-600 bg-green-100' }
                ].map((risk) => (
                  <div key={risk.level} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${risk.color}`}>
                      {risk.level} Risk
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{risk.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          {/* Category Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.categories.map((category, index) => {
                const TrendIcon = getTrendIcon(category.trend);
                return (
                  <div key={category.name} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <TrendIcon className={`h-4 w-4 ${
                        category.trend === 'up' ? 'text-green-500' :
                        category.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Suppliers</span>
                        <span className="font-medium">{category.count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Score</span>
                        <span className="font-medium">{category.avgScore.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="suppliers" className="space-y-6">
          {viewMode === 'cards' ? (
            /* Supplier Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedSuppliers.map((supplier) => (
                <motion.div
                  key={supplier.supplierId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`p-6 cursor-pointer transition-all ${
                    selectedSupplier === supplier.supplierId ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedSupplier(
                    selectedSupplier === supplier.supplierId ? null : supplier.supplierId
                  )}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-600">{supplier.category}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {supplier.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(supplier.overallScore)}`}>
                          {supplier.overallScore}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(supplier.relationship)}`}>
                          {supplier.relationship}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(supplier.risks.level)}`}>
                          {supplier.risks.level} risk
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Quality</p>
                          <p className="font-medium">{supplier.scores.quality}/100</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Delivery</p>
                          <p className="font-medium">{supplier.scores.delivery}/100</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost</p>
                          <p className="font-medium">{supplier.scores.cost}/100</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Service</p>
                          <p className="font-medium">{supplier.scores.service}/100</p>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Contract Value</span>
                          <span className="font-medium">{formatCurrency(supplier.contracts.totalValue)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Supplier Table */
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Relationship
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contract Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedSuppliers.map((supplier, index) => (
                      <tr key={supplier.supplierId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                            <div className="text-sm text-gray-500">{supplier.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(supplier.overallScore)}`}>
                            {supplier.overallScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(supplier.relationship)}`}>
                            {supplier.relationship}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(supplier.risks.level)}`}>
                            {supplier.risks.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(supplier.contracts.totalValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSupplier(supplier.supplierId)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          
          {/* Detailed Supplier View */}
          <AnimatePresence>
            {selectedSupplier && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {(() => {
                  const supplier = data.suppliers.find(s => s.supplierId === selectedSupplier);
                  if (!supplier) return null;
                  
                  return (
                    <Card className="p-6 border-2 border-blue-200 bg-blue-50">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {supplier.name} - Detailed Analysis
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSupplier(null)}
                        >
                          Close
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Score Breakdown */}
                        <div className="lg:col-span-2">
                          <h4 className="font-medium text-gray-900 mb-3">Performance Scores</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(supplier.scores).map(([key, score]) => (
                              <div key={key} className="bg-white rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-600 capitalize">{key}</p>
                                <p className={`text-lg font-bold ${
                                  score >= 80 ? 'text-green-600' :
                                  score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {score}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Contact Information */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                          <div className="bg-white rounded-lg p-4 space-y-2">
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              {supplier.contact.phone}
                            </div>
                            <div className="flex items-center text-sm">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              {supplier.contact.email}
                            </div>
                            <div className="text-sm">
                              <p className="text-gray-600">Primary: {supplier.contact.primaryContact}</p>
                              <p className="text-gray-600">Alternate: {supplier.contact.alternateContact}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Risk Analysis */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                            Risk Analysis
                          </h4>
                          <div className="bg-white rounded-lg p-4">
                            <div className="mb-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(supplier.risks.level)}`}>
                                {supplier.risks.level} risk
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{supplier.risks.impact}</p>
                            <div className="space-y-1">
                              {supplier.risks.factors.map((factor, index) => (
                                <p key={index} className="text-xs text-gray-600">• {factor}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Recommendations */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                            Recommendations
                          </h4>
                          <div className="bg-white rounded-lg p-4">
                            <ul className="space-y-2">
                              {supplier.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          {/* Performance Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            <div className="bg-gray-50 rounded-lg p-8 mb-4">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Performance trend visualization</p>
                <p className="text-sm">(Interactive charts would be implemented here)</p>
              </div>
            </div>
            
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Top Performers</h4>
                <div className="space-y-2">
                  {data.suppliers
                    .sort((a, b) => b.overallScore - a.overallScore)
                    .slice(0, 3)
                    .map((supplier, index) => (
                      <div key={supplier.supplierId} className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">{supplier.name}</span>
                        <span className="font-medium text-blue-900">{supplier.overallScore}</span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Needs Attention</h4>
                <div className="space-y-2">
                  {data.suppliers
                    .filter(s => s.overallScore < 70)
                    .slice(0, 3)
                    .map((supplier, index) => (
                      <div key={supplier.supplierId} className="flex items-center justify-between text-sm">
                        <span className="text-yellow-700">{supplier.name}</span>
                        <span className="font-medium text-yellow-900">{supplier.overallScore}</span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Most Improved</h4>
                <div className="space-y-2">
                  {data.suppliers
                    .filter(s => s.trends.overall === 'improving')
                    .slice(0, 3)
                    .map((supplier, index) => (
                      <div key={supplier.supplierId} className="flex items-center justify-between text-sm">
                        <span className="text-green-700">{supplier.name}</span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="risks" className="space-y-6">
          {/* Risk Matrix */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.suppliers
                .filter(s => s.risks.level === 'critical' || s.risks.level === 'high')
                .map((supplier) => (
                  <div key={supplier.supplierId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(supplier.risks.level)}`}>
                        {supplier.risks.level} risk
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{supplier.risks.impact}</p>
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-gray-600">Mitigation Actions:</h5>
                      {supplier.risks.mitigation.slice(0, 2).map((action, index) => (
                        <p key={index} className="text-xs text-gray-600">• {action}</p>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-6">
          {/* Active Alerts */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
            <div className="space-y-4">
              {data.alerts
                .filter(alert => alert.status === 'open')
                .map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50' :
                    'border-l-yellow-500 bg-yellow-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{alert.supplierName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{alert.date}</span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                    <div className="mt-3 flex space-x-2">
                      <Button size="sm" variant="outline">
                        Acknowledge
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
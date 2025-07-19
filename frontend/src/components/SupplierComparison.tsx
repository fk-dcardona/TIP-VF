'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Clock,
  Package,
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
  Globe,
  Heart,
  Zap,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  Filter,
  ArrowUpDown,
  Scale,
  ThumbsUp,
  ThumbsDown,
  Info,
  Calculator,
  Percent
} from 'lucide-react';

interface SupplierData {
  supplierId: string;
  name: string;
  category: string;
  location: string;
  country: string;
  established: number;
  employees: number;
  certifications: string[];
  
  // Performance Metrics
  scores: {
    overall: number;
    quality: number;
    delivery: number;
    cost: number;
    service: number;
    financial: number;
    innovation: number;
    sustainability: number;
    compliance: number;
  };
  
  // Key Performance Indicators
  kpis: {
    onTimeDelivery: number;
    qualityRating: number;
    defectRate: number;
    leadTime: number;
    responseTime: number;
    fillRate: number;
    costCompetitiveness: number;
    paymentTerms: number;
  };
  
  // Financial Information
  financials: {
    annualRevenue: number;
    creditRating: string;
    paymentHistory: number;
    priceIndex: number; // relative to market average
    costTrend: 'improving' | 'stable' | 'increasing';
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  // Capacity & Capabilities
  capacity: {
    totalCapacity: number;
    currentUtilization: number;
    availableCapacity: number;
    scalability: 'high' | 'medium' | 'low';
    flexibilityScore: number;
    technologyLevel: 'advanced' | 'modern' | 'standard' | 'basic';
  };
  
  // Relationship & Contract
  relationship: {
    yearsPartnership: number;
    contractValue: number;
    contractExpiry: string;
    relationshipType: 'strategic' | 'preferred' | 'approved' | 'trial';
    communicationScore: number;
    supportLevel: 'excellent' | 'good' | 'fair' | 'poor';
  };
  
  // Risk Assessment
  risks: {
    geopolitical: number;
    financial: number;
    operational: number;
    environmental: number;
    cybersecurity: number;
    overall: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Competitive Analysis
  competitive: {
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
    differentiators: string[];
    weaknesses: string[];
    competitiveAdvantage: string;
    marketShare: number;
  };
  
  // Contact Information
  contact: {
    primaryContact: string;
    email: string;
    phone: string;
    website: string;
    accountManager: string;
  };
}

interface ComparisonCriteria {
  id: string;
  name: string;
  weight: number;
  category: 'performance' | 'financial' | 'risk' | 'relationship';
  format: 'percentage' | 'currency' | 'number' | 'days' | 'score';
  higherIsBetter: boolean;
}

interface SupplierComparisonProps {
  data: {
    suppliers: SupplierData[];
    benchmarks: {
      industryAverage: {
        quality: number;
        delivery: number;
        cost: number;
        leadTime: number;
      };
      bestInClass: {
        quality: number;
        delivery: number;
        cost: number;
        leadTime: number;
      };
    };
    comparisonCriteria: ComparisonCriteria[];
    recommendations: {
      preferred: string[];
      avoid: string[];
      develop: string[];
      reasons: Record<string, string[]>;
    };
  };
  loading?: boolean;
}

export default function SupplierComparison({ data, loading = false }: SupplierComparisonProps) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'matrix' | 'radar'>('side-by-side');
  const [scoringWeights, setScoringWeights] = useState<Record<string, number>>(
    data.comparisonCriteria.reduce((acc, criteria) => {
      acc[criteria.id] = criteria.weight;
      return acc;
    }, {} as Record<string, number>)
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('overall');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
  // Toggle supplier selection
  const toggleSupplier = (supplierId: string) => {
    const newSelected = new Set(selectedSuppliers);
    if (newSelected.has(supplierId)) {
      newSelected.delete(supplierId);
    } else {
      if (newSelected.size < 5) { // Limit to 5 suppliers for comparison
        newSelected.add(supplierId);
      }
    }
    setSelectedSuppliers(newSelected);
  };
  
  // Calculate weighted score for supplier
  const calculateWeightedScore = (supplier: SupplierData) => {
    let totalScore = 0;
    let totalWeight = 0;
    
    data.comparisonCriteria.forEach(criteria => {
      const weight = scoringWeights[criteria.id] || criteria.weight;
      let value = 0;
      
      // Get value based on criteria
      switch (criteria.id) {
        case 'quality':
          value = supplier.scores.quality;
          break;
        case 'delivery':
          value = supplier.scores.delivery;
          break;
        case 'cost':
          value = supplier.scores.cost;
          break;
        case 'financial':
          value = supplier.scores.financial;
          break;
        case 'leadTime':
          value = 100 - (supplier.kpis.leadTime / 30 * 100); // Convert to score
          break;
        case 'onTimeDelivery':
          value = supplier.kpis.onTimeDelivery;
          break;
        default:
          value = supplier.scores.overall;
      }
      
      totalScore += value * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };
  
  // Process and sort suppliers
  const processedSuppliers = useMemo(() => {
    let filtered = data.suppliers;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(supplier => supplier.category === filterCategory);
    }
    
    if (showOnlySelected) {
      filtered = filtered.filter(supplier => selectedSuppliers.has(supplier.supplierId));
    }
    
    return filtered.sort((a, b) => {
      const aScore = calculateWeightedScore(a);
      const bScore = calculateWeightedScore(b);
      return bScore - aScore; // Highest score first
    });
  }, [data.suppliers, filterCategory, showOnlySelected, selectedSuppliers, scoringWeights]);
  
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(value);
      case 'days':
        return `${value.toFixed(0)} days`;
      case 'score':
        return `${value.toFixed(0)}/100`;
      default:
        return value.toLocaleString();
    }
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
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'strategic':
        return 'text-purple-600 bg-purple-100';
      case 'preferred':
        return 'text-blue-600 bg-blue-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Scale className="h-8 w-8 mr-3" />
              Multi-Supplier Comparison Tool
            </h2>
            <p className="text-orange-100">Compare and evaluate suppliers across multiple criteria</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{selectedSuppliers.size}</div>
            <div className="text-orange-200">Selected for Comparison</div>
            <div className="text-sm text-orange-300 mt-1">
              {data.suppliers.length} total suppliers
            </div>
          </div>
        </div>
        
        {/* Selection Summary */}
        {selectedSuppliers.size > 0 && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur">
            <p className="text-sm text-orange-100 mb-2">Selected Suppliers:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedSuppliers).map(supplierId => {
                const supplier = data.suppliers.find(s => s.supplierId === supplierId);
                return (
                  <span key={supplierId} className="inline-flex items-center px-2 py-1 bg-white/20 rounded text-sm">
                    {supplier?.name}
                    <button
                      onClick={() => toggleSupplier(supplierId)}
                      className="ml-1 text-orange-200 hover:text-white"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Comparison Controls</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant={comparisonMode === 'side-by-side' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('side-by-side')}
            >
              Side-by-Side
            </Button>
            <Button
              variant={comparisonMode === 'matrix' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('matrix')}
            >
              Matrix
            </Button>
            <Button
              variant={comparisonMode === 'radar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('radar')}
            >
              Radar Chart
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
              {Array.from(new Set(data.suppliers.map(s => s.category))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="overall">Overall Score</option>
              <option value="quality">Quality</option>
              <option value="delivery">Delivery</option>
              <option value="cost">Cost</option>
              <option value="relationship">Relationship</option>
            </select>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOnlySelected}
              onChange={(e) => setShowOnlySelected(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show only selected</span>
          </label>
          
          <div className="text-sm text-gray-500">
            {selectedSuppliers.size}/5 selected for comparison
          </div>
        </div>
      </Card>
      
      {/* Main Content */}
      <Tabs defaultValue="selection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="selection">Selection</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="selection" className="space-y-6">
          {/* Supplier Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedSuppliers.map((supplier) => {
              const isSelected = selectedSuppliers.has(supplier.supplierId);
              const weightedScore = calculateWeightedScore(supplier);
              
              return (
                <motion.div
                  key={supplier.supplierId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`p-6 cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                  onClick={() => toggleSupplier(supplier.supplierId)}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-600">{supplier.category}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {supplier.location}, {supplier.country}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isSelected ? (
                          <CheckCircle className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Plus className="h-5 w-5 text-gray-400" />
                        )}
                        <div className={`text-center px-3 py-1 rounded-full ${getScoreColor(weightedScore)}`}>
                          <span className="font-bold">{weightedScore.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(supplier.relationship.relationshipType)}`}>
                          {supplier.relationship.relationshipType}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(supplier.risks.overall)}`}>
                          {supplier.risks.overall} risk
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
                          <p className="text-gray-600">Lead Time</p>
                          <p className="font-medium">{supplier.kpis.leadTime} days</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost Index</p>
                          <p className="font-medium">{supplier.financials.priceIndex.toFixed(1)}</p>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Contract Value</span>
                          <span className="font-medium">
                            {formatValue(supplier.relationship.contractValue, 'currency')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          {selectedSuppliers.size > 1 && (
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-900 font-medium">
                    {selectedSuppliers.size} suppliers selected for comparison
                  </span>
                </div>
                <Button
                  onClick={() => {/* Navigate to comparison tab */}}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Compare Selected
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-6">
          {selectedSuppliers.size === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suppliers Selected</h3>
              <p className="text-gray-600 mb-4">Select at least 2 suppliers to start comparison</p>
              <Button onClick={() => {/* Navigate back to selection */}}>
                <Plus className="h-4 w-4 mr-2" />
                Select Suppliers
              </Button>
            </Card>
          ) : comparisonMode === 'side-by-side' ? (
            /* Side-by-Side Comparison */
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Side-by-Side Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Criteria</th>
                        {Array.from(selectedSuppliers).map(supplierId => {
                          const supplier = data.suppliers.find(s => s.supplierId === supplierId);
                          return (
                            <th key={supplierId} className="text-center py-3 px-4 font-medium text-gray-900">
                              {supplier?.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* Overall Score */}
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900">Overall Score</td>
                        {Array.from(selectedSuppliers).map(supplierId => {
                          const supplier = data.suppliers.find(s => s.supplierId === supplierId);
                          const score = supplier ? calculateWeightedScore(supplier) : 0;
                          return (
                            <td key={supplierId} className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${getScoreColor(score)}`}>
                                {score.toFixed(0)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                      
                      {/* Key Performance Metrics */}
                      {[
                        { key: 'quality', label: 'Quality Score', path: 'scores.quality', format: 'score' },
                        { key: 'delivery', label: 'Delivery Score', path: 'scores.delivery', format: 'score' },
                        { key: 'cost', label: 'Cost Score', path: 'scores.cost', format: 'score' },
                        { key: 'leadTime', label: 'Lead Time', path: 'kpis.leadTime', format: 'days' },
                        { key: 'onTimeDelivery', label: 'On-Time Delivery', path: 'kpis.onTimeDelivery', format: 'percentage' },
                        { key: 'qualityRating', label: 'Quality Rating', path: 'kpis.qualityRating', format: 'percentage' },
                        { key: 'priceIndex', label: 'Price Index', path: 'financials.priceIndex', format: 'number' },
                        { key: 'riskLevel', label: 'Risk Level', path: 'risks.overall', format: 'text' },
                      ].map((metric) => (
                        <tr key={metric.key}>
                          <td className="py-3 px-4 font-medium text-gray-900">{metric.label}</td>
                          {Array.from(selectedSuppliers).map(supplierId => {
                            const supplier = data.suppliers.find(s => s.supplierId === supplierId);
                            if (!supplier) return <td key={supplierId} className="py-3 px-4 text-center">-</td>;
                            
                            // Get nested value
                            const value = metric.path.split('.').reduce((obj, key) => obj?.[key], supplier);
                            
                            return (
                              <td key={supplierId} className="py-3 px-4 text-center">
                                {metric.format === 'text' ? (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(value)}`}>
                                    {value}
                                  </span>
                                ) : (
                                  formatValue(value, metric.format)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : comparisonMode === 'matrix' ? (
            /* Matrix Comparison */
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Matrix</h3>
              <div className="bg-gray-50 rounded-lg p-8">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Performance matrix visualization</p>
                  <p className="text-sm">(Scatter plot would be implemented here)</p>
                </div>
              </div>
            </Card>
          ) : (
            /* Radar Chart Comparison */
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Radar Chart Comparison</h3>
              <div className="bg-gray-50 rounded-lg p-8">
                <div className="text-center text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-2" />
                  <p>Radar chart visualization</p>
                  <p className="text-sm">(Multi-supplier radar chart would be implemented here)</p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="scoring" className="space-y-6">
          {/* Custom Scoring Weights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-blue-500" />
              Custom Scoring Weights
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Adjust the importance of each criteria to customize supplier rankings based on your priorities.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.comparisonCriteria.map((criteria) => (
                <div key={criteria.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">{criteria.name}</label>
                    <span className="text-sm text-gray-500">{scoringWeights[criteria.id] || criteria.weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={scoringWeights[criteria.id] || criteria.weight}
                    onChange={(e) => setScoringWeights(prev => ({
                      ...prev,
                      [criteria.id]: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Not Important</span>
                    <span>Very Important</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total Weight: {Object.values(scoringWeights).reduce((sum, weight) => sum + weight, 0)}%
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScoringWeights(
                    data.comparisonCriteria.reduce((acc, criteria) => {
                      acc[criteria.id] = criteria.weight;
                      return acc;
                    }, {} as Record<string, number>)
                  )}
                >
                  Reset to Default
                </Button>
                <Button size="sm">Apply Weights</Button>
              </div>
            </div>
          </Card>
          
          {/* Updated Rankings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Updated Rankings</h3>
            <div className="space-y-3">
              {processedSuppliers.slice(0, 10).map((supplier, index) => {
                const score = calculateWeightedScore(supplier);
                return (
                  <div key={supplier.supplierId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{supplier.name}</p>
                        <p className="text-sm text-gray-600">{supplier.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${getScoreColor(score)}`}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-6">
          {/* AI Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-green-50 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <ThumbsUp className="h-5 w-5 mr-2" />
                Preferred Suppliers
              </h3>
              <div className="space-y-3">
                {data.recommendations.preferred.map((supplierId) => {
                  const supplier = data.suppliers.find(s => s.supplierId === supplierId);
                  if (!supplier) return null;
                  
                  return (
                    <div key={supplierId} className="p-3 bg-white rounded-lg">
                      <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                      <p className="text-sm text-gray-600">{supplier.category}</p>
                      <ul className="mt-2 space-y-1">
                        {data.recommendations.reasons[supplierId]?.slice(0, 2).map((reason, index) => (
                          <li key={index} className="text-xs text-green-700">• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
            
            <Card className="p-6 bg-yellow-50 border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Develop Further
              </h3>
              <div className="space-y-3">
                {data.recommendations.develop.map((supplierId) => {
                  const supplier = data.suppliers.find(s => s.supplierId === supplierId);
                  if (!supplier) return null;
                  
                  return (
                    <div key={supplierId} className="p-3 bg-white rounded-lg">
                      <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                      <p className="text-sm text-gray-600">{supplier.category}</p>
                      <ul className="mt-2 space-y-1">
                        {data.recommendations.reasons[supplierId]?.slice(0, 2).map((reason, index) => (
                          <li key={index} className="text-xs text-yellow-700">• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
            
            <Card className="p-6 bg-red-50 border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <ThumbsDown className="h-5 w-5 mr-2" />
                Consider Alternatives
              </h3>
              <div className="space-y-3">
                {data.recommendations.avoid.map((supplierId) => {
                  const supplier = data.suppliers.find(s => s.supplierId === supplierId);
                  if (!supplier) return null;
                  
                  return (
                    <div key={supplierId} className="p-3 bg-white rounded-lg">
                      <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                      <p className="text-sm text-gray-600">{supplier.category}</p>
                      <ul className="mt-2 space-y-1">
                        {data.recommendations.reasons[supplierId]?.slice(0, 2).map((reason, index) => (
                          <li key={index} className="text-xs text-red-700">• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
          
          {/* Benchmarking */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Benchmarking</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.benchmarks.industryAverage).map(([metric, value]) => (
                <div key={metric} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{metric}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {metric === 'leadTime' ? formatValue(value, 'days') : formatValue(value, 'score')}
                  </p>
                  <p className="text-xs text-gray-500">Industry Avg</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.benchmarks.bestInClass).map(([metric, value]) => (
                <div key={metric} className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 capitalize">{metric}</p>
                  <p className="text-lg font-bold text-blue-900">
                    {metric === 'leadTime' ? formatValue(value, 'days') : formatValue(value, 'score')}
                  </p>
                  <p className="text-xs text-blue-500">Best in Class</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          {/* Report Generation */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Comparison Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Executive Summary</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    High-level comparison with key recommendations and rankings.
                  </p>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Detailed Analysis</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Comprehensive report with all metrics and supporting data.
                  </p>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Supplier Scorecards</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Individual scorecards for each selected supplier.
                  </p>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Data Export</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Export raw comparison data for further analysis.
                  </p>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
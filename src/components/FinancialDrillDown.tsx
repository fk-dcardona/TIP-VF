'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  MapPin,
  Calendar,
  Filter,
  Download,
  ArrowUpDown,
  Percent,
  Target,
  AlertTriangle,
  Info
} from 'lucide-react';

interface FinancialMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  benchmark?: number;
  status: 'good' | 'warning' | 'critical';
  children?: FinancialMetric[];
  unit?: 'currency' | 'percentage' | 'days' | 'number';
}

interface FinancialDrillDownProps {
  data: {
    workingCapital: FinancialMetric;
    cashFlow: FinancialMetric;
    profitability: FinancialMetric;
    efficiency: FinancialMetric;
    historicalData: {
      period: string;
      workingCapital: number;
      cashFlow: number;
      revenue: number;
      costs: number;
      profit: number;
    }[];
    segmentData: {
      id: string;
      name: string;
      type: 'product' | 'customer' | 'region';
      revenue: number;
      costs: number;
      profit: number;
      margin: number;
      workingCapital: number;
      cashCycle: number;
    }[];
  };
  loading?: boolean;
}

export default function FinancialDrillDown({ data, loading = false }: FinancialDrillDownProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedSegment, setSelectedSegment] = useState<string>('product');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };
  
  const formatValue = (value: number, unit: string = 'currency') => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'days':
        return `${value.toFixed(0)} days`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  };
  
  const getChangeIcon = (change: number) => {
    return change > 0 ? TrendingUp : change < 0 ? TrendingDown : ArrowUpDown;
  };
  
  // Process segment data with filtering and sorting
  const processedSegmentData = useMemo(() => {
    let filtered = data.segmentData.filter(item => item.type === selectedSegment);
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        if (filterStatus === 'profitable') return item.margin > 0;
        if (filterStatus === 'unprofitable') return item.margin < 0;
        if (filterStatus === 'high-margin') return item.margin > 20;
        if (filterStatus === 'low-margin') return item.margin < 10;
        return true;
      });
    }
    
    return filtered.sort((a, b) => {
      const aValue = a[sortField as keyof typeof a] as number;
      const bValue = b[sortField as keyof typeof b] as number;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data.segmentData, selectedSegment, filterStatus, sortField, sortDirection]);
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }
  
  const MetricNode = ({ metric, level = 0 }: { metric: FinancialMetric; level?: number }) => {
    const hasChildren = metric.children && metric.children.length > 0;
    const isExpanded = expandedNodes.has(metric.id);
    const ChangeIcon = getChangeIcon(metric.change);
    
    return (
      <div className={`${level > 0 ? 'ml-6' : ''}`}>
        <div
          className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 ${
            hasChildren ? 'border-gray-200' : 'border-gray-100'
          }`}
          onClick={() => hasChildren && toggleNode(metric.id)}
        >
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <button className="text-gray-400 hover:text-gray-600">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            <div>
              <h4 className="font-medium text-gray-900">{metric.name}</h4>
              {metric.benchmark && (
                <p className="text-xs text-gray-500">
                  Benchmark: {formatValue(metric.benchmark, metric.unit)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {formatValue(metric.value, metric.unit)}
              </p>
              {metric.change !== 0 && (
                <div className={`flex items-center text-sm ${getChangeColor(metric.change)}`}>
                  <ChangeIcon className="h-3 w-3 mr-1" />
                  <span>{formatValue(Math.abs(metric.change), metric.unit)}</span>
                  <span className="ml-1">({metric.changePercent.toFixed(1)}%)</span>
                </div>
              )}
            </div>
            
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
              {metric.status}
            </span>
          </div>
        </div>
        
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {metric.children!.map((child) => (
                <MetricNode key={child.id} metric={child} level={level + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Financial Drill-Down Analysis</h2>
            <p className="text-gray-300">Deep-dive into financial performance with detailed breakdowns</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-gray-800 border-gray-300">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="text-gray-800 border-gray-300">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Analysis Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="segments">Segmentation</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="variance">Variance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="space-y-6">
          {/* Key Financial Metrics Hierarchy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Capital Analysis</h3>
              <div className="space-y-4">
                <MetricNode metric={data.workingCapital} />
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Analysis</h3>
              <div className="space-y-4">
                <MetricNode metric={data.cashFlow} />
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability Analysis</h3>
              <div className="space-y-4">
                <MetricNode metric={data.profitability} />
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Metrics</h3>
              <div className="space-y-4">
                <MetricNode metric={data.efficiency} />
              </div>
            </Card>
          </div>
          
          {/* Summary Insights */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[data.workingCapital, data.cashFlow, data.profitability, data.efficiency]
                .filter(metric => metric.status === 'critical')
                .slice(0, 3)
                .map((metric, index) => (
                  <div key={index} className="flex items-start p-3 bg-white rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{metric.name}</p>
                      <p className="text-sm text-gray-600">
                        {metric.change < 0 ? 'Declined' : 'Increased'} by {Math.abs(metric.changePercent)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="segments" className="space-y-6">
          {/* Segment Controls */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Segment Analysis</h3>
              <div className="flex space-x-2">
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="product">By Product</option>
                  <option value="customer">By Customer</option>
                  <option value="region">By Region</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Items</option>
                  <option value="profitable">Profitable</option>
                  <option value="unprofitable">Unprofitable</option>
                  <option value="high-margin">High Margin ({'>'}20%)</option>
                  <option value="low-margin">Low Margin ({'<'}10%)</option>
                </select>
              </div>
            </div>
            
            {/* Segment Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        setSortField('name');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      {selectedSegment === 'product' ? 'Product' : 
                       selectedSegment === 'customer' ? 'Customer' : 'Region'}
                      <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        setSortField('revenue');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Revenue <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        setSortField('costs');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Costs <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        setSortField('profit');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Profit <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        setSortField('margin');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Margin <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        setSortField('workingCapital');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Working Capital <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        setSortField('cashCycle');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Cash Cycle <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedSegmentData.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {selectedSegment === 'product' && <Package className="h-4 w-4 text-gray-400 mr-2" />}
                          {selectedSegment === 'customer' && <Users className="h-4 w-4 text-gray-400 mr-2" />}
                          {selectedSegment === 'region' && <MapPin className="h-4 w-4 text-gray-400 mr-2" />}
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatValue(item.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatValue(item.costs)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className={`font-medium ${item.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatValue(item.profit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className={`font-medium ${
                          item.margin > 20 ? 'text-green-600' : 
                          item.margin > 10 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {formatValue(item.margin, 'percentage')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatValue(item.workingCapital)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatValue(item.cashCycle, 'days')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          {/* Historical Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Trends</h3>
            
            {/* Trend visualization placeholder */}
            <div className="bg-gray-50 rounded-lg p-8 mb-6">
              <div className="text-center text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                <p>Historical trend visualization</p>
                <p className="text-sm">(Chart component would be implemented here)</p>
              </div>
            </div>
            
            {/* Trend Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-900">Period</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-900">Working Capital</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-900">Cash Flow</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-900">Revenue</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-900">Costs</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-900">Profit</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-900">Margin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.historicalData.map((period, index) => {
                    const margin = (period.profit / period.revenue) * 100;
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-2 font-medium text-gray-900">{period.period}</td>
                        <td className="px-4 py-2 text-right">{formatValue(period.workingCapital)}</td>
                        <td className="px-4 py-2 text-right">{formatValue(period.cashFlow)}</td>
                        <td className="px-4 py-2 text-right">{formatValue(period.revenue)}</td>
                        <td className="px-4 py-2 text-right">{formatValue(period.costs)}</td>
                        <td className={`px-4 py-2 text-right font-medium ${period.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatValue(period.profit)}
                        </td>
                        <td className="px-4 py-2 text-right">{formatValue(margin, 'percentage')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="variance" className="space-y-6">
          {/* Variance Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance Analysis</h3>
            
            {/* Budget vs Actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Budget
                  </span>
                </div>
                <p className="text-sm text-blue-700">Working Capital Budget</p>
                <p className="text-xl font-bold text-blue-900">{formatValue(5000000)}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Actual
                  </span>
                </div>
                <p className="text-sm text-green-700">Actual Working Capital</p>
                <p className="text-xl font-bold text-green-900">{formatValue(data.workingCapital.value)}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Percent className="h-5 w-5 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                    Variance
                  </span>
                </div>
                <p className="text-sm text-yellow-700">Budget Variance</p>
                <p className="text-xl font-bold text-yellow-900">
                  {formatValue(data.workingCapital.value - 5000000)}
                </p>
              </div>
            </div>
            
            {/* Variance Explanation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Variance Analysis Notes</p>
                  <ul className="text-sm text-gray-700 mt-1 space-y-1">
                    <li>• Working capital is {data.workingCapital.value > 5000000 ? 'above' : 'below'} budget due to {data.workingCapital.value > 5000000 ? 'higher inventory levels' : 'improved collection efficiency'}</li>
                    <li>• Cash conversion cycle impact: {formatValue(data.cashFlow.change, 'days')} variance from plan</li>
                    <li>• Seasonal adjustments may be required for Q2 and Q4 planning</li>
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
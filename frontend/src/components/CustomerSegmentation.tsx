'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, DollarSign, Package, BarChart2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface Customer {
  id: string;
  name: string;
  industry: string;
  region: string;
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrderDate: string;
  growthRate: number;
  segment: 'enterprise' | 'mid-market' | 'small-business';
}

interface CustomerSegmentationProps {
  customers: Customer[];
  loading?: boolean;
}

export default function CustomerSegmentation({ customers, loading = false }: CustomerSegmentationProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  
  // Calculate segment metrics
  const segmentMetrics = useMemo(() => {
    const metrics = {
      enterprise: { count: 0, revenue: 0, avgOrderValue: 0, growth: 0 },
      'mid-market': { count: 0, revenue: 0, avgOrderValue: 0, growth: 0 },
      'small-business': { count: 0, revenue: 0, avgOrderValue: 0, growth: 0 }
    };
    
    customers.forEach(customer => {
      const segment = customer.segment;
      metrics[segment].count++;
      metrics[segment].revenue += customer.revenue;
      metrics[segment].avgOrderValue += customer.avgOrderValue;
      metrics[segment].growth += customer.growthRate;
    });
    
    // Calculate averages
    Object.keys(metrics).forEach(segment => {
      const seg = segment as keyof typeof metrics;
      if (metrics[seg].count > 0) {
        metrics[seg].avgOrderValue /= metrics[seg].count;
        metrics[seg].growth /= metrics[seg].count;
      }
    });
    
    return metrics;
  }, [customers]);
  
  // Calculate industry breakdown
  const industryBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; revenue: number; growth: number }> = {};
    
    customers.forEach(customer => {
      if (!breakdown[customer.industry]) {
        breakdown[customer.industry] = { count: 0, revenue: 0, growth: 0 };
      }
      breakdown[customer.industry].count++;
      breakdown[customer.industry].revenue += customer.revenue;
      breakdown[customer.industry].growth += customer.growthRate;
    });
    
    // Calculate average growth per industry
    Object.keys(breakdown).forEach(industry => {
      breakdown[industry].growth /= breakdown[industry].count;
    });
    
    return Object.entries(breakdown)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [customers]);
  
  // Filter customers based on selection
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (selectedSegment && customer.segment !== selectedSegment) return false;
      if (selectedIndustry && customer.industry !== selectedIndustry) return false;
      return true;
    });
  }, [customers, selectedSegment, selectedIndustry]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'mid-market': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'small-business': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Customer Segmentation Analysis</h2>
            <p className="text-indigo-100">Understanding who you're selling to and their value</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{customers.length}</div>
            <div className="text-indigo-200">Total Customers</div>
          </div>
        </div>
      </div>
      
      {/* Segment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(segmentMetrics).map(([segment, metrics]) => (
          <motion.div
            key={segment}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`p-6 cursor-pointer transition-all ${
                selectedSegment === segment ? 'ring-2 ring-indigo-500 shadow-lg' : ''
              }`}
              onClick={() => setSelectedSegment(selectedSegment === segment ? null : segment)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSegmentColor(segment)}`}>
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.count}</p>
                  <p className="text-sm text-gray-500">Customers</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(metrics.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">Total Revenue</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {metrics.growth.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Avg Growth</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(metrics.avgOrderValue)}
                  </p>
                  <p className="text-xs text-gray-500">Avg Order Value</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Industry Breakdown */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Industries</h3>
          <BarChart2 className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {industryBreakdown.map(([industry, data]) => (
            <motion.div
              key={industry}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedIndustry === industry 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedIndustry(selectedIndustry === industry ? null : industry)}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{industry}</p>
                  <p className="text-sm text-gray-500">{data.count} customers</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(data.revenue)}
                  </p>
                  <p className="text-sm text-green-600">
                    +{data.growth.toFixed(1)}% growth
                  </p>
                </div>
              </div>
              
              <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.revenue / customers.reduce((sum, c) => sum + c.revenue, 0)) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
      
      {/* Customer List */}
      {(selectedSegment || selectedIndustry) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Filtered Customers ({filteredCustomers.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSegment(null);
                setSelectedIndustry(null);
              }}
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.slice(0, 10).map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.region}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{customer.industry}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(customer.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{customer.orderCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        customer.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {customer.growthRate > 0 ? '+' : ''}{customer.growthRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Fastest Growing Segment</p>
              <p className="text-xs text-purple-700">
                Enterprise customers: +{segmentMetrics.enterprise.growth.toFixed(1)}% avg
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">Highest Value Segment</p>
              <p className="text-xs text-green-700">
                {formatCurrency(segmentMetrics.enterprise.avgOrderValue)} per order
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Volume Leader</p>
              <p className="text-xs text-blue-700">
                Mid-market: {segmentMetrics['mid-market'].count} active customers
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
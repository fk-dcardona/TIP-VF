'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, DollarSign, Clock, AlertCircle, Calendar, Package, Users, CreditCard } from 'lucide-react';

interface CashCycleData {
  daysInventoryOutstanding: number;
  daysSalesOutstanding: number;
  daysPayableOutstanding: number;
  cashConversionCycle: number;
  workingCapital: number;
  inventoryValue: number;
  receivables: number;
  payables: number;
  monthlyRevenue: number;
  historicalData: {
    month: string;
    ccc: number;
    workingCapital: number;
  }[];
}

interface CashConversionCycleProps {
  data: CashCycleData;
  loading?: boolean;
}

export default function CashConversionCycle({ data, loading = false }: CashConversionCycleProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  // Calculate trapped cash and opportunities
  const trappedCash = useMemo(() => {
    const industryBestCCC = 30; // Industry benchmark
    const excessDays = Math.max(0, data.cashConversionCycle - industryBestCCC);
    const dailyRevenue = data.monthlyRevenue / 30;
    return excessDays * dailyRevenue;
  }, [data]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getMetricColor = (days: number, type: 'dio' | 'dso' | 'dpo' | 'ccc') => {
    if (type === 'dpo') {
      // For payables, longer is better
      if (days > 45) return 'text-green-600 bg-green-100';
      if (days > 30) return 'text-blue-600 bg-blue-100';
      return 'text-orange-600 bg-orange-100';
    } else {
      // For others, shorter is better
      if (days < 30) return 'text-green-600 bg-green-100';
      if (days < 45) return 'text-blue-600 bg-blue-100';
      return 'text-orange-600 bg-orange-100';
    }
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }
  
  const cycleComponents = [
    {
      id: 'dio',
      label: 'Days Inventory Outstanding',
      value: data.daysInventoryOutstanding,
      icon: Package,
      color: '#8B5CF6',
      description: 'Time inventory sits before sale',
      cashAmount: data.inventoryValue,
      formula: 'Inventory ÷ (COGS/365)'
    },
    {
      id: 'dso',
      label: 'Days Sales Outstanding',
      value: data.daysSalesOutstanding,
      icon: Clock,
      color: '#3B82F6',
      description: 'Time to collect payment',
      cashAmount: data.receivables,
      formula: 'Receivables ÷ (Revenue/365)'
    },
    {
      id: 'dpo',
      label: 'Days Payable Outstanding',
      value: data.daysPayableOutstanding,
      icon: Calendar,
      color: '#10B981',
      description: 'Time to pay suppliers',
      cashAmount: data.payables,
      formula: 'Payables ÷ (COGS/365)',
      isNegative: true
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Cash Conversion Cycle Analysis</h2>
            <p className="text-blue-100">Understanding how cash flows through your operations</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{data.cashConversionCycle} days</div>
            <div className="text-blue-200">Current Cycle</div>
          </div>
        </div>
        
        {/* Key Insight */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-300 mr-2" />
            <p className="text-sm">
              <span className="font-semibold">Trapped Cash:</span> {formatCurrency(trappedCash)} 
              {' '}could be freed by optimizing to industry best practices (30-day cycle)
            </p>
          </div>
        </div>
      </div>
      
      {/* Visual Cash Cycle Flow */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Cash Flow Timeline</h3>
        
        <div className="relative">
          {/* Timeline */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-100 rounded-full -translate-y-1/2" />
          
          {/* Components */}
          <div className="relative flex justify-between items-center">
            {cycleComponents.map((component, index) => (
              <motion.div
                key={component.id}
                className="relative flex flex-col items-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 }}
              >
                {/* Connector */}
                {index < cycleComponents.length - 1 && (
                  <motion.div
                    className="absolute top-1/2 -right-1/2 transform -translate-y-1/2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 + 0.5 }}
                  >
                    <ArrowRight className="h-6 w-6 text-gray-400" />
                  </motion.div>
                )}
                
                {/* Component Card */}
                <motion.div
                  className={`relative z-10 p-6 bg-white rounded-xl shadow-lg border-2 cursor-pointer transition-all ${
                    selectedMetric === component.id ? 'border-blue-500 shadow-xl' : 'border-gray-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedMetric(component.id === selectedMetric ? null : component.id)}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div 
                      className="p-3 rounded-full"
                      style={{ backgroundColor: `${component.color}20` }}
                    >
                      <component.icon 
                        className="h-6 w-6"
                        style={{ color: component.color }}
                      />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">
                        {component.isNegative ? '-' : '+'}{component.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">days</p>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-700 text-center">
                      {component.label}
                    </p>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getMetricColor(component.value, component.id as any)
                    }`}>
                      {formatCurrency(component.cashAmount)}
                    </span>
                  </div>
                </motion.div>
                
                {/* Description on hover */}
                {selectedMetric === component.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 p-3 bg-gray-900 text-white rounded-lg text-sm w-48 z-20"
                  >
                    <p className="font-medium mb-1">{component.description}</p>
                    <p className="text-xs text-gray-300">Formula: {component.formula}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Summary Box */}
          <motion.div
            className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg font-medium text-gray-700">Cash Conversion Cycle =</span>
              <span className="text-xl font-bold text-blue-600">
                {data.daysInventoryOutstanding} + {data.daysSalesOutstanding} - {data.daysPayableOutstanding}
              </span>
              <span className="text-lg font-medium text-gray-700">= {data.cashConversionCycle} days</span>
            </div>
          </motion.div>
        </div>
      </Card>
      
      {/* Working Capital Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Package className="h-5 w-5 text-purple-500" />
            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Inventory
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.inventoryValue)}</p>
          <p className="text-sm text-gray-500 mt-1">Cash tied in inventory</p>
          <div className="mt-3 text-xs text-gray-600">
            <p>Turnover: {(365 / data.daysInventoryOutstanding).toFixed(1)}x per year</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Receivables
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.receivables)}</p>
          <p className="text-sm text-gray-500 mt-1">Waiting for payment</p>
          <div className="mt-3 text-xs text-gray-600">
            <p>Collection: Every {data.daysSalesOutstanding} days</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-5 w-5 text-green-500" />
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Payables
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.payables)}</p>
          <p className="text-sm text-gray-500 mt-1">Free financing from suppliers</p>
          <div className="mt-3 text-xs text-gray-600">
            <p>Payment terms: {data.daysPayableOutstanding} days</p>
          </div>
        </Card>
      </div>
      
      {/* Historical Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Cycle Trend</h3>
        <div className="relative h-64">
          {/* Simple line chart visualization */}
          <svg className="w-full h-full" viewBox="0 0 800 200">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 50}
                x2="800"
                y2={i * 50}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}
            
            {/* Data line */}
            <motion.path
              d={`M ${data.historicalData.map((d, i) => 
                `${(i / (data.historicalData.length - 1)) * 750 + 25},${200 - (d.ccc / 100) * 180}`
              ).join(' L ')}`}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5 }}
            />
            
            {/* Area fill */}
            <motion.path
              d={`M ${data.historicalData.map((d, i) => 
                `${(i / (data.historicalData.length - 1)) * 750 + 25},${200 - (d.ccc / 100) * 180}`
              ).join(' L ')} L 775,200 L 25,200 Z`}
              fill="url(#gradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            
            {/* Data points */}
            {data.historicalData.map((d, i) => (
              <circle
                key={i}
                cx={(i / (data.historicalData.length - 1)) * 750 + 25}
                cy={200 - (d.ccc / 100) * 180}
                r="4"
                fill="#3B82F6"
                className="cursor-pointer"
              >
                <title>{`${d.month}: ${d.ccc} days`}</title>
              </circle>
            ))}
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
            <span>100d</span>
            <span>75d</span>
            <span>50d</span>
            <span>25d</span>
            <span>0d</span>
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
            {data.historicalData.map((d, i) => (
              <span key={i} className="transform -rotate-45 origin-top-left">
                {d.month}
              </span>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Optimization Opportunities */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Optimization Opportunities</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Reduce Inventory Days</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Target: 30 days • Potential: {formatCurrency(data.inventoryValue * 0.2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Accelerate Collections</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Target: 25 days • Potential: {formatCurrency(data.receivables * 0.15)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Extend Payment Terms</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Target: 45 days • Benefit: {formatCurrency(data.monthlyRevenue * 0.1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
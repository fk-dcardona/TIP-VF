'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown, Package, Clock, Calendar, DollarSign, ChevronRight, Lightbulb } from 'lucide-react';

interface CashTrap {
  id: string;
  category: 'inventory' | 'receivables' | 'processes' | 'terms';
  title: string;
  amount: number;
  percentage: number;
  rootCauses: string[];
  impact: 'high' | 'medium' | 'low';
  daysImpact: number;
  recommendations: string[];
}

interface TrappedCashAnalysisProps {
  cashTraps: CashTrap[];
  totalWorkingCapital: number;
  loading?: boolean;
}

export default function TrappedCashAnalysis({ 
  cashTraps, 
  totalWorkingCapital,
  loading = false 
}: TrappedCashAnalysisProps) {
  const [selectedTrap, setSelectedTrap] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const categories = [
    { id: 'all', label: 'All Issues', icon: AlertTriangle },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'receivables', label: 'Receivables', icon: Clock },
    { id: 'processes', label: 'Processes', icon: TrendingDown },
    { id: 'terms', label: 'Payment Terms', icon: Calendar }
  ];
  
  const filteredTraps = activeCategory === 'all' 
    ? cashTraps 
    : cashTraps.filter(trap => trap.category === activeCategory);
  
  const totalTrappedCash = cashTraps.reduce((sum, trap) => sum + trap.amount, 0);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'inventory': return '#8B5CF6';
      case 'receivables': return '#3B82F6';
      case 'processes': return '#EF4444';
      case 'terms': return '#10B981';
      default: return '#6B7280';
    }
  };
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  const selectedTrapData = cashTraps.find(trap => trap.id === selectedTrap);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Trapped Cash Root Cause Analysis</h2>
            <p className="text-red-100">Identifying where and why cash is stuck in your operations</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(totalTrappedCash)}</div>
            <div className="text-red-200">Total Trapped Cash</div>
            <div className="text-sm text-red-300 mt-1">
              {((totalTrappedCash / totalWorkingCapital) * 100).toFixed(1)}% of working capital
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map(category => {
          const categoryIcon = category.icon;
          const categoryTraps = category.id === 'all' 
            ? cashTraps 
            : cashTraps.filter(t => t.category === category.id);
          const categoryAmount = categoryTraps.reduce((sum, t) => sum + t.amount, 0);
          
          return (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category.id)}
              className="flex items-center whitespace-nowrap"
            >
              <category.icon className="h-4 w-4 mr-2" />
              {category.label}
              <span className="ml-2 text-xs">
                ({formatCurrency(categoryAmount)})
              </span>
            </Button>
          );
        })}
      </div>
      
      {/* Cash Trap Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTraps.map(trap => (
          <motion.div
            key={trap.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card 
              className={`p-6 cursor-pointer transition-all ${
                selectedTrap === trap.id ? 'ring-2 ring-orange-500 shadow-lg' : ''
              }`}
              onClick={() => setSelectedTrap(trap.id === selectedTrap ? null : trap.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getCategoryColor(trap.category) }}
                  />
                  <h3 className="font-semibold text-gray-900">{trap.title}</h3>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(trap.impact)}`}>
                  {trap.impact} impact
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(trap.amount)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {trap.percentage}% of total
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{trap.daysImpact} days impact on cycle</span>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 font-medium mb-2">Root Causes:</p>
                  <ul className="space-y-1">
                    {trap.rootCauses.slice(0, 2).map((cause, index) => (
                      <li key={index} className="flex items-start text-xs text-gray-500">
                        <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                        {cause}
                      </li>
                    ))}
                    {trap.rootCauses.length > 2 && (
                      <li className="text-xs text-gray-400 pl-4">
                        +{trap.rootCauses.length - 2} more...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Progress bar showing impact */}
              <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: getCategoryColor(trap.category) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(trap.amount / totalTrappedCash) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Detailed Analysis Panel */}
      <AnimatePresence>
        {selectedTrapData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 border-2 border-orange-200 bg-orange-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detailed Analysis: {selectedTrapData.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTrap(null)}
                >
                  Close
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Root Causes */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                    Root Causes
                  </h4>
                  <ul className="space-y-2">
                    {selectedTrapData.rootCauses.map((cause, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-medium mr-2 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-green-600" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {selectedTrapData.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <ChevronRight className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Impact Metrics */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(selectedTrapData.amount)}
                  </p>
                  <p className="text-xs text-gray-500">Cash Impact</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <Clock className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedTrapData.daysImpact} days
                  </p>
                  <p className="text-xs text-gray-500">Cycle Impact</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <TrendingDown className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedTrapData.percentage}%
                  </p>
                  <p className="text-xs text-gray-500">Of Trapped Cash</p>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="mt-6 flex justify-center">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  Create Action Plan
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Summary Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Trap Distribution</h3>
          <div className="space-y-3">
            {Object.entries(
              cashTraps.reduce((acc, trap) => {
                acc[trap.category] = (acc[trap.category] || 0) + trap.amount;
                return acc;
              }, {} as Record<string, number>)
            ).map(([category, amount]) => {
              const percentage = (amount / totalTrappedCash) * 100;
              const categoryLabel = categories.find(c => c.id === category)?.label || category;
              
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{categoryLabel}</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(amount)} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getCategoryColor(category) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Wins</h3>
          <div className="space-y-3">
            {cashTraps
              .filter(trap => trap.daysImpact <= 15)
              .slice(0, 3)
              .map(trap => (
                <div key={trap.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{trap.title}</p>
                    <p className="text-sm text-gray-500">
                      Fix in {trap.daysImpact} days
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(trap.amount)}
                  </p>
                </div>
              ))}
          </div>
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Total Quick Win Opportunity:</span>{' '}
              {formatCurrency(
                cashTraps
                  .filter(trap => trap.daysImpact <= 15)
                  .reduce((sum, trap) => sum + trap.amount, 0)
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
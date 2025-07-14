'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Calendar, Info, AlertCircle, ChevronRight } from 'lucide-react';

interface PaymentTermsData {
  currentReceivableTerms: number; // Days customers take to pay
  currentPayableTerms: number; // Days we take to pay suppliers
  averageReceivables: number;
  averagePayables: number;
  annualRevenue: number;
  annualCOGS: number;
  borrowingRate: number; // Annual interest rate for working capital financing
  investmentRate: number; // Annual return rate on cash investments
}

interface PaymentTermsCalculatorProps {
  data: PaymentTermsData;
  loading?: boolean;
}

export default function PaymentTermsCalculator({ data, loading = false }: PaymentTermsCalculatorProps) {
  const [newReceivableTerms, setNewReceivableTerms] = useState(data.currentReceivableTerms);
  const [newPayableTerms, setNewPayableTerms] = useState(data.currentPayableTerms);
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate impacts
  const calculations = useMemo(() => {
    const dailyRevenue = data.annualRevenue / 365;
    const dailyCOGS = data.annualCOGS / 365;
    
    // Current state
    const currentCCC = data.currentReceivableTerms - data.currentPayableTerms;
    const currentWorkingCapital = (data.currentReceivableTerms * dailyRevenue) - (data.currentPayableTerms * dailyCOGS);
    
    // New state
    const newCCC = newReceivableTerms - newPayableTerms;
    const newWorkingCapital = (newReceivableTerms * dailyRevenue) - (newPayableTerms * dailyCOGS);
    
    // Changes
    const workingCapitalChange = newWorkingCapital - currentWorkingCapital;
    const cccChange = newCCC - currentCCC;
    
    // Financial impact
    const annualFinancingCost = currentWorkingCapital > 0 
      ? currentWorkingCapital * (data.borrowingRate / 100)
      : Math.abs(currentWorkingCapital) * (data.investmentRate / 100);
    
    const newFinancingCost = newWorkingCapital > 0 
      ? newWorkingCapital * (data.borrowingRate / 100)
      : Math.abs(newWorkingCapital) * (data.investmentRate / 100);
    
    const annualSavings = annualFinancingCost - newFinancingCost;
    
    // Cash flow impact
    const cashFlowImprovement = -workingCapitalChange; // Negative change in WC = positive cash flow
    
    return {
      currentCCC,
      newCCC,
      cccChange,
      currentWorkingCapital,
      newWorkingCapital,
      workingCapitalChange,
      annualFinancingCost,
      newFinancingCost,
      annualSavings,
      cashFlowImprovement,
      receivablesDaysChange: newReceivableTerms - data.currentReceivableTerms,
      payablesDaysChange: newPayableTerms - data.currentPayableTerms
    };
  }, [data, newReceivableTerms, newPayableTerms]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const formatDays = (days: number) => {
    const sign = days > 0 ? '+' : '';
    return `${sign}${days} days`;
  };
  
  const getImpactColor = (value: number, inverse: boolean = false) => {
    if (inverse) {
      return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
    }
    return value < 0 ? 'text-green-600' : value > 0 ? 'text-red-600' : 'text-gray-600';
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
  
  const hasChanges = newReceivableTerms !== data.currentReceivableTerms || 
                     newPayableTerms !== data.currentPayableTerms;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Payment Terms Impact Calculator</h2>
            <p className="text-indigo-100">Optimize payment terms to improve cash flow and reduce financing costs</p>
          </div>
          <Calculator className="h-12 w-12 text-indigo-200" />
        </div>
        
        {/* Current Status */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-indigo-200 text-sm">Working Capital</p>
            <p className="text-xl font-bold">{formatCurrency(calculations.currentWorkingCapital)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-indigo-200 text-sm">Cash Cycle</p>
            <p className="text-xl font-bold">{calculations.currentCCC} days</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-indigo-200 text-sm">Annual Cost</p>
            <p className="text-xl font-bold">{formatCurrency(calculations.annualFinancingCost)}</p>
          </div>
        </div>
      </div>
      
      {/* Terms Adjustment */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Simulate Payment Terms Changes</h3>
        
        <div className="space-y-8">
          {/* Customer Payment Terms */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  Customer Payment Terms (Receivables)
                </h4>
                <p className="text-sm text-gray-500 mt-1">Days customers take to pay you</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{newReceivableTerms} days</p>
                {newReceivableTerms !== data.currentReceivableTerms && (
                  <p className={`text-sm ${getImpactColor(calculations.receivablesDaysChange)}`}>
                    {formatDays(calculations.receivablesDaysChange)}
                  </p>
                )}
              </div>
            </div>
            <Slider
              value={[newReceivableTerms]}
              onValueChange={(value) => setNewReceivableTerms(value[0])}
              min={0}
              max={90}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 days (COD)</span>
              <span>30</span>
              <span>60</span>
              <span>90 days</span>
            </div>
          </div>
          
          {/* Supplier Payment Terms */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-500" />
                  Supplier Payment Terms (Payables)
                </h4>
                <p className="text-sm text-gray-500 mt-1">Days you take to pay suppliers</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{newPayableTerms} days</p>
                {newPayableTerms !== data.currentPayableTerms && (
                  <p className={`text-sm ${getImpactColor(calculations.payablesDaysChange, true)}`}>
                    {formatDays(calculations.payablesDaysChange)}
                  </p>
                )}
              </div>
            </div>
            <Slider
              value={[newPayableTerms]}
              onValueChange={(value) => setNewPayableTerms(value[0])}
              min={0}
              max={90}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 days (COD)</span>
              <span>30</span>
              <span>60</span>
              <span>90 days</span>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewReceivableTerms(30);
              setNewPayableTerms(45);
            }}
          >
            Industry Standard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewReceivableTerms(data.currentReceivableTerms - 10);
              setNewPayableTerms(data.currentPayableTerms + 10);
            }}
          >
            Quick Win (-10/+10)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewReceivableTerms(data.currentReceivableTerms);
              setNewPayableTerms(data.currentPayableTerms);
            }}
          >
            Reset to Current
          </Button>
        </div>
      </Card>
      
      {/* Impact Analysis */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-2 border-indigo-200 bg-indigo-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                Projected Impact Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cash Flow Impact */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      calculations.cashFlowImprovement > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {calculations.cashFlowImprovement > 0 ? 'Improvement' : 'Deterioration'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Cash Flow Impact</p>
                  <p className={`text-xl font-bold ${getImpactColor(calculations.cashFlowImprovement, true)}`}>
                    {formatCurrency(Math.abs(calculations.cashFlowImprovement))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculations.cashFlowImprovement > 0 ? 'Cash released' : 'Cash required'}
                  </p>
                </div>
                
                {/* Working Capital Change */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      calculations.workingCapitalChange < 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Working Capital
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">WC Requirement</p>
                  <p className={`text-xl font-bold ${getImpactColor(calculations.workingCapitalChange)}`}>
                    {formatCurrency(Math.abs(calculations.workingCapitalChange))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculations.workingCapitalChange < 0 ? 'Reduction' : 'Increase'}
                  </p>
                </div>
                
                {/* Cash Cycle Change */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      calculations.cccChange < 0 
                        ? 'bg-green-100 text-green-800' 
                        : calculations.cccChange > 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      Cash Cycle
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Cycle Days</p>
                  <p className="text-xl font-bold text-gray-900">
                    {calculations.newCCC} days
                  </p>
                  <p className={`text-xs mt-1 ${getImpactColor(calculations.cccChange)}`}>
                    {formatDays(calculations.cccChange)}
                  </p>
                </div>
                
                {/* Annual Savings */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      calculations.annualSavings > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Annual Impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Cost Savings</p>
                  <p className={`text-xl font-bold ${getImpactColor(calculations.annualSavings, true)}`}>
                    {formatCurrency(Math.abs(calculations.annualSavings))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculations.annualSavings > 0 ? 'Savings per year' : 'Additional cost'}
                  </p>
                </div>
              </div>
              
              {/* Detailed Breakdown */}
              <div className="mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full"
                >
                  {showDetails ? 'Hide' : 'Show'} Detailed Calculations
                  <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Detailed Calculations */}
      <AnimatePresence>
        {showDetails && hasChanges && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Calculations</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current State */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Current State</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Receivable Terms:</dt>
                        <dd className="font-medium">{data.currentReceivableTerms} days</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Payable Terms:</dt>
                        <dd className="font-medium">{data.currentPayableTerms} days</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Cash Conversion Cycle:</dt>
                        <dd className="font-medium">{calculations.currentCCC} days</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Working Capital:</dt>
                        <dd className="font-medium">{formatCurrency(calculations.currentWorkingCapital)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Annual Financing Cost:</dt>
                        <dd className="font-medium">{formatCurrency(calculations.annualFinancingCost)}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  {/* New State */}
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Projected State</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Receivable Terms:</dt>
                        <dd className="font-medium">{newReceivableTerms} days</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Payable Terms:</dt>
                        <dd className="font-medium">{newPayableTerms} days</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Cash Conversion Cycle:</dt>
                        <dd className="font-medium">{calculations.newCCC} days</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Working Capital:</dt>
                        <dd className="font-medium">{formatCurrency(calculations.newWorkingCapital)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Annual Financing Cost:</dt>
                        <dd className="font-medium">{formatCurrency(calculations.newFinancingCost)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Calculation Notes */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Calculation Method:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Working Capital = (Receivables × Daily Revenue) - (Payables × Daily COGS)</li>
                        <li>• Cash Conversion Cycle = Receivable Days - Payable Days</li>
                        <li>• Financing Cost = Working Capital × {data.borrowingRate}% (when positive)</li>
                        <li>• Investment Return = Working Capital × {data.investmentRate}% (when negative)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Recommendations */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Recommendations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-blue-600" />
              Optimize Receivables
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                Offer 2/10 net 30 discounts to incentivize early payment
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                Implement automated payment reminders at 7, 3, and 0 days
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                Consider factoring for large invoices over $50,000
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Extend Payables
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                Negotiate volume-based extended payment terms
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                Use supply chain financing for strategic suppliers
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0 mt-0.5" />
                Maintain good relationships while maximizing terms
              </li>
            </ul>
          </div>
        </div>
        
        {/* Action Alert */}
        {calculations.annualSavings > 100000 && (
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-green-700 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Significant Opportunity Detected!</p>
                <p className="text-sm text-green-700 mt-1">
                  The proposed payment terms changes could save {formatCurrency(calculations.annualSavings)} annually.
                  Consider implementing these changes gradually over 3-6 months to maintain supplier relationships.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
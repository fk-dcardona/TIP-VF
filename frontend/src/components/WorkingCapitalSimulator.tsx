'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Clock, 
  Calendar, 
  AlertTriangle,
  Play,
  RotateCcw,
  Target,
  Info
} from 'lucide-react';

interface WorkingCapitalData {
  currentInventory: number;
  currentReceivables: number;
  currentPayables: number;
  annualRevenue: number;
  annualCOGS: number;
  averageInventoryTurnover: number;
  averageReceivableDays: number;
  averagePayableDays: number;
  borrowingRate: number;
  growthRate: number;
  seasonalVariation: number;
  industryBenchmarks: {
    inventoryTurnover: number;
    receivableDays: number;
    payableDays: number;
    workingCapitalRatio: number;
  };
}

interface WorkingCapitalSimulatorProps {
  data: WorkingCapitalData;
  loading?: boolean;
}

interface SimulationScenario {
  name: string;
  inventoryTurnover: number;
  receivableDays: number;
  payableDays: number;
  salesGrowth: number;
  description: string;
}

export default function WorkingCapitalSimulator({ data, loading = false }: WorkingCapitalSimulatorProps) {
  // Simulation parameters
  const [inventoryTurnover, setInventoryTurnover] = useState(data.averageInventoryTurnover);
  const [receivableDays, setReceivableDays] = useState(data.averageReceivableDays);
  const [payableDays, setPayableDays] = useState(data.averagePayableDays);
  const [salesGrowth, setSalesGrowth] = useState(data.growthRate);
  const [simulationPeriod, setSimulationPeriod] = useState(12); // months
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);
  
  // Predefined scenarios
  const scenarios: SimulationScenario[] = [
    {
      name: 'Industry Best Practice',
      inventoryTurnover: data.industryBenchmarks.inventoryTurnover,
      receivableDays: data.industryBenchmarks.receivableDays,
      payableDays: data.industryBenchmarks.payableDays,
      salesGrowth: data.growthRate,
      description: 'Match industry benchmarks across all metrics'
    },
    {
      name: 'Aggressive Optimization',
      inventoryTurnover: data.averageInventoryTurnover * 1.5,
      receivableDays: Math.max(15, data.averageReceivableDays * 0.7),
      payableDays: Math.min(60, data.averagePayableDays * 1.3),
      salesGrowth: data.growthRate,
      description: 'Maximize efficiency with tight controls'
    },
    {
      name: 'Growth Scenario',
      inventoryTurnover: data.averageInventoryTurnover * 0.9,
      receivableDays: data.averageReceivableDays * 1.1,
      payableDays: data.averagePayableDays,
      salesGrowth: data.growthRate * 2,
      description: 'Support rapid growth with increased buffer'
    },
    {
      name: 'Conservative Approach',
      inventoryTurnover: data.averageInventoryTurnover * 0.8,
      receivableDays: data.averageReceivableDays * 1.2,
      payableDays: data.averagePayableDays * 0.9,
      salesGrowth: data.growthRate * 0.5,
      description: 'Maintain safety margins and supplier relationships'
    }
  ];
  
  // Calculate simulation results
  const simulation = useMemo(() => {
    const monthlyResults = [];
    let cumulativeRevenue = data.annualRevenue;
    let cumulativeCOGS = data.annualCOGS;
    
    for (let month = 1; month <= simulationPeriod; month++) {
      // Apply growth
      const monthlyGrowthFactor = Math.pow(1 + salesGrowth / 100, month / 12);
      const adjustedRevenue = cumulativeRevenue * monthlyGrowthFactor;
      const adjustedCOGS = cumulativeCOGS * monthlyGrowthFactor;
      
      // Apply seasonal variation
      const seasonalFactor = 1 + (data.seasonalVariation / 100) * Math.sin((month - 1) * 2 * Math.PI / 12);
      const seasonalRevenue = adjustedRevenue * seasonalFactor;
      const seasonalCOGS = adjustedCOGS * seasonalFactor;
      
      // Calculate working capital components
      const dailyRevenue = seasonalRevenue / 365;
      const dailyCOGS = seasonalCOGS / 365;
      const avgInventory = seasonalCOGS / inventoryTurnover;
      
      const receivables = receivableDays * dailyRevenue;
      const payables = payableDays * dailyCOGS;
      const inventory = avgInventory;
      
      const workingCapital = inventory + receivables - payables;
      const cashConversionCycle = (avgInventory / dailyCOGS) + receivableDays - payableDays;
      const financingCost = workingCapital * (data.borrowingRate / 100) / 12;
      
      monthlyResults.push({
        month,
        revenue: seasonalRevenue,
        cogs: seasonalCOGS,
        inventory,
        receivables,
        payables,
        workingCapital,
        cashConversionCycle,
        financingCost,
        seasonalFactor
      });
    }
    
    // Calculate current state for comparison
    const currentDailyCOGS = data.annualCOGS / 365;
    const currentInventory = data.annualCOGS / data.averageInventoryTurnover;
    const currentReceivables = data.averageReceivableDays * (data.annualRevenue / 365);
    const currentPayables = data.averagePayableDays * currentDailyCOGS;
    const currentWorkingCapital = currentInventory + currentReceivables - currentPayables;
    const currentCCC = (currentInventory / currentDailyCOGS) + data.averageReceivableDays - data.averagePayableDays;
    
    // Calculate averages and totals
    const avgWorkingCapital = monthlyResults.reduce((sum, r) => sum + r.workingCapital, 0) / simulationPeriod;
    const totalFinancingCost = monthlyResults.reduce((sum, r) => sum + r.financingCost, 0);
    const avgCashCycle = monthlyResults.reduce((sum, r) => sum + r.cashConversionCycle, 0) / simulationPeriod;
    const maxWorkingCapital = Math.max(...monthlyResults.map(r => r.workingCapital));
    const minWorkingCapital = Math.min(...monthlyResults.map(r => r.workingCapital));
    
    return {
      monthlyResults,
      currentWorkingCapital,
      currentCCC,
      avgWorkingCapital,
      totalFinancingCost,
      avgCashCycle,
      maxWorkingCapital,
      minWorkingCapital,
      workingCapitalChange: avgWorkingCapital - currentWorkingCapital,
      cccChange: avgCashCycle - currentCCC,
      annualSavings: (currentWorkingCapital - avgWorkingCapital) * (data.borrowingRate / 100)
    };
  }, [data, inventoryTurnover, receivableDays, payableDays, salesGrowth, simulationPeriod]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getImpactColor = (value: number, inverse: boolean = false) => {
    if (inverse) {
      return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
    }
    return value < 0 ? 'text-green-600' : value > 0 ? 'text-red-600' : 'text-gray-600';
  };
  
  const applyScenario = (scenario: SimulationScenario) => {
    setInventoryTurnover(scenario.inventoryTurnover);
    setReceivableDays(scenario.receivableDays);
    setPayableDays(scenario.payableDays);
    setSalesGrowth(scenario.salesGrowth);
    setActiveScenario(scenario.name);
  };
  
  const resetToDefaults = () => {
    setInventoryTurnover(data.averageInventoryTurnover);
    setReceivableDays(data.averageReceivableDays);
    setPayableDays(data.averagePayableDays);
    setSalesGrowth(data.growthRate);
    setActiveScenario(null);
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Working Capital Simulator</h2>
            <p className="text-purple-100">Model different scenarios to optimize cash flow and working capital</p>
          </div>
          <BarChart3 className="h-12 w-12 text-purple-200" />
        </div>
        
        {/* Current vs Simulated */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-purple-200 text-sm">Current WC</p>
            <p className="text-xl font-bold">{formatCurrency(simulation.currentWorkingCapital)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-purple-200 text-sm">Simulated WC</p>
            <p className="text-xl font-bold">{formatCurrency(simulation.avgWorkingCapital)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-purple-200 text-sm">Impact</p>
            <p className={`text-xl font-bold ${getImpactColor(simulation.workingCapitalChange)}`}>
              {formatCurrency(Math.abs(simulation.workingCapitalChange))}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <p className="text-purple-200 text-sm">Annual Savings</p>
            <p className={`text-xl font-bold ${getImpactColor(simulation.annualSavings, true)}`}>
              {formatCurrency(Math.abs(simulation.annualSavings))}
            </p>
          </div>
        </div>
      </div>
      
      {/* Simulation Controls */}
      <Tabs defaultValue="parameters" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="parameters" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Simulation Parameters</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                {activeScenario && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {activeScenario}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Inventory Parameters */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Package className="h-4 w-4 mr-2 text-purple-500" />
                        Inventory Turnover
                      </h4>
                      <p className="text-sm text-gray-500">Times per year inventory is sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{inventoryTurnover.toFixed(1)}x</p>
                      <p className="text-sm text-gray-500">
                        {(365 / inventoryTurnover).toFixed(0)} days
                      </p>
                    </div>
                  </div>
                  <Slider
                    value={[inventoryTurnover]}
                    onValueChange={(value) => setInventoryTurnover(value[0])}
                    min={1}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1x (slow)</span>
                    <span>Industry: {data.industryBenchmarks.inventoryTurnover}x</span>
                    <span>20x (fast)</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        Receivable Days
                      </h4>
                      <p className="text-sm text-gray-500">Days to collect payment</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{receivableDays}</p>
                      <p className="text-sm text-gray-500">days</p>
                    </div>
                  </div>
                  <Slider
                    value={[receivableDays]}
                    onValueChange={(value) => setReceivableDays(value[0])}
                    min={0}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0 (COD)</span>
                    <span>Industry: {data.industryBenchmarks.receivableDays}d</span>
                    <span>90 days</span>
                  </div>
                </div>
              </div>
              
              {/* Payment & Growth Parameters */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-green-500" />
                        Payable Days
                      </h4>
                      <p className="text-sm text-gray-500">Days to pay suppliers</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{payableDays}</p>
                      <p className="text-sm text-gray-500">days</p>
                    </div>
                  </div>
                  <Slider
                    value={[payableDays]}
                    onValueChange={(value) => setPayableDays(value[0])}
                    min={0}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0 (COD)</span>
                    <span>Industry: {data.industryBenchmarks.payableDays}d</span>
                    <span>90 days</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                        Sales Growth
                      </h4>
                      <p className="text-sm text-gray-500">Annual growth rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{salesGrowth}%</p>
                      <p className="text-sm text-gray-500">annual</p>
                    </div>
                  </div>
                  <Slider
                    value={[salesGrowth]}
                    onValueChange={(value) => setSalesGrowth(value[0])}
                    min={-20}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>-20%</span>
                    <span>0%</span>
                    <span>+100%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Simulation Period */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Simulation Period</h4>
                  <p className="text-sm text-gray-500">Months to simulate</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{simulationPeriod}</p>
                  <p className="text-sm text-gray-500">months</p>
                </div>
              </div>
              <Slider
                value={[simulationPeriod]}
                onValueChange={(value) => setSimulationPeriod(value[0])}
                min={3}
                max={24}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>3 months</span>
                <span>12 months</span>
                <span>24 months</span>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="scenarios" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pre-configured Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario, index) => (
                <motion.div
                  key={index}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    activeScenario === scenario.name 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => applyScenario(scenario)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                    {activeScenario === scenario.name && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Inventory:</span>
                      <span className="font-medium ml-1">{scenario.inventoryTurnover.toFixed(1)}x</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Receivables:</span>
                      <span className="font-medium ml-1">{scenario.receivableDays}d</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payables:</span>
                      <span className="font-medium ml-1">{scenario.payableDays}d</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Growth:</span>
                      <span className="font-medium ml-1">{scenario.salesGrowth}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  simulation.workingCapitalChange < 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {simulation.workingCapitalChange < 0 ? 'Improvement' : 'Increase'}
                </span>
              </div>
              <p className="text-sm text-gray-600">Avg Working Capital</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(simulation.avgWorkingCapital)}</p>
              <p className={`text-xs mt-1 ${getImpactColor(simulation.workingCapitalChange)}`}>
                {simulation.workingCapitalChange < 0 ? '' : '+'}
                {formatCurrency(simulation.workingCapitalChange)}
              </p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  simulation.cccChange < 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  Cash Cycle
                </span>
              </div>
              <p className="text-sm text-gray-600">Avg Cash Cycle</p>
              <p className="text-xl font-bold text-gray-900">{simulation.avgCashCycle.toFixed(1)} days</p>
              <p className={`text-xs mt-1 ${getImpactColor(simulation.cccChange)}`}>
                {simulation.cccChange < 0 ? '' : '+'}
                {simulation.cccChange.toFixed(1)} days
              </p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-gray-400" />
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Range
                </span>
              </div>
              <p className="text-sm text-gray-600">WC Variation</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(simulation.maxWorkingCapital - simulation.minWorkingCapital)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(simulation.minWorkingCapital)} - {formatCurrency(simulation.maxWorkingCapital)}
              </p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  simulation.annualSavings > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  Annual Impact
                </span>
              </div>
              <p className="text-sm text-gray-600">Cost Savings</p>
              <p className={`text-xl font-bold ${getImpactColor(simulation.annualSavings, true)}`}>
                {formatCurrency(Math.abs(simulation.annualSavings))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {simulation.annualSavings > 0 ? 'Savings' : 'Additional cost'}
              </p>
            </Card>
          </div>
          
          {/* Monthly Breakdown Toggle */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Simulation Results</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
              >
                {showMonthlyBreakdown ? 'Hide' : 'Show'} Monthly Details
              </Button>
            </div>
            
            {/* Chart visualization would go here */}
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Monthly working capital visualization</p>
                <p className="text-sm">(Chart component would be implemented here)</p>
              </div>
            </div>
            
            {/* Monthly Breakdown Table */}
            <AnimatePresence>
              {showMonthlyBreakdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-x-auto"
                >
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">Month</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-900">Inventory</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-900">Receivables</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-900">Payables</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-900">Working Capital</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-900">Cash Cycle</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-900">Monthly Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {simulation.monthlyResults.map((month, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-2 font-medium text-gray-900">{month.month}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(month.inventory)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(month.receivables)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(month.payables)}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(month.workingCapital)}</td>
                          <td className="px-4 py-2 text-right">{month.cashConversionCycle.toFixed(1)}d</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(month.financingCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          
          {/* Recommendations */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
            <div className="space-y-3">
              {simulation.annualSavings > 50000 && (
                <div className="flex items-start p-3 bg-green-100 rounded-lg">
                  <Target className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">High Impact Opportunity</p>
                    <p className="text-sm text-green-700">
                      Implementing these changes could save {formatCurrency(simulation.annualSavings)} annually.
                    </p>
                  </div>
                </div>
              )}
              
              {simulation.maxWorkingCapital - simulation.minWorkingCapital > simulation.avgWorkingCapital * 0.3 && (
                <div className="flex items-start p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900">High Variability Warning</p>
                    <p className="text-sm text-yellow-700">
                      Working capital varies significantly month-to-month. Consider implementing buffer strategies.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start p-3 bg-blue-100 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">Implementation Strategy</p>
                  <p className="text-sm text-blue-700">
                    Phase implementation over 6 months to maintain operational stability and supplier relationships.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PsychologyTheme } from '@/theme/psychology-theme';
import WaterFlowBackground from '@/components/magic/WaterFlowBackground';
import BreathingContainer from '@/components/magic/BreathingContainer';
import KPIEvolutionCard from '@/components/psychology/KPIEvolutionCard';
import { 
  DollarSign, TrendingUp, Activity, Calendar, 
  AlertCircle, RefreshCw, BarChart3, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FinanceDashboardSkeleton } from '@/components/ui/skeleton';

interface FinanceDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
  } | null;
  onDataUpdate?: () => void;
  loading?: boolean;
  error?: Error | null;
  isRetrying?: boolean;
  analytics?: any;
}

export default function ConfidenceFinanceDashboard({ 
  data, 
  onDataUpdate, 
  loading = false, 
  error = null,
  isRetrying = false,
  analytics
}: FinanceDashboardProps) {
  const [currentFlow, setCurrentFlow] = useState(0);
  const theme = PsychologyTheme.confidence;
  
  // Create flowing animation for financial data
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFlow(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  // Show loading state
  if (loading && !data) {
    return <FinanceDashboardSkeleton />;
  }
  
  // Show error state with confidence-building messaging
  if (error && !data) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Temporary Data Access Issue</AlertTitle>
        <AlertDescription className="text-red-700">
          We're having trouble retrieving your financial data. This is temporary and your data is safe.
          {onDataUpdate && (
            <div className="mt-4">
              <Button 
                onClick={onDataUpdate} 
                disabled={isRetrying}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reconnect
                  </>
                )}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Use data with fallbacks
  const financial_insights = data?.financial_insights || {};
  const product_performance = data?.product_performance || [];
  const key_metrics = data?.key_metrics || {};
  
  // Financial metrics
  const totalInventoryValue = financial_insights?.total_inventory_value || analytics?.total_inventory_value || 0;
  const monthlyBurnRate = financial_insights?.monthly_burn_rate || analytics?.monthly_burn_rate || 0;
  const workingCapitalEfficiency = financial_insights?.working_capital_efficiency || analytics?.working_capital_efficiency || 0;
  const inventoryToSalesRatio = financial_insights?.inventory_to_sales_ratio || analytics?.inventory_to_sales_ratio || 0;
  
  const daysOfCashInInventory = financial_insights?.days_cash_in_inventory || 
    (monthlyBurnRate > 0 ? (totalInventoryValue / monthlyBurnRate) * 30 : 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div 
      className="space-y-6 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: theme.animations.transition.smooth / 1000 }}
    >
      {/* Subtle flowing background */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <WaterFlowBackground psychologyLevel="confidence" intensity={0.3} />
      </div>
      
      {/* Finance Header - Confidence Building */}
      <motion.div
        className="relative rounded-xl p-6 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
          boxShadow: `0 10px 30px ${theme.colors.primary}20`
        }}
        animate={{
          boxShadow: [
            `0 10px 30px ${theme.colors.primary}20`,
            `0 15px 40px ${theme.colors.primary}30`,
            `0 10px 30px ${theme.colors.primary}20`
          ]
        }}
        transition={{
          duration: theme.animations.pulse.duration / 1000,
          repeat: Infinity,
          ease: theme.animations.pulse.easing
        }}
      >
        {/* Flowing overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.colors.accent}20 50%, transparent 100%)`,
          }}
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        <div className="relative z-10 flex items-center justify-between">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 
              className="mb-2"
              style={{
                ...theme.typography.hero,
                color: 'white'
              }}
            >
              Financial Command Center
            </h1>
            <p style={{ color: theme.colors.surface, opacity: 0.9 }}>
              Real-time cash flow intelligence and financial decision support
            </p>
          </motion.div>
          
          <motion.div 
            className="text-right"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <div 
              className="font-bold"
              style={{ 
                fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                color: 'white'
              }}
            >
              {formatCurrency(totalInventoryValue)}
            </div>
            <div style={{ color: theme.colors.surface }}>
              Active Capital Deployed
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Financial KPIs - Confidence Building Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Monthly Burn Rate */}
        <BreathingContainer psychologyLevel="confidence" intensity={0.8}>
          <KPIEvolutionCard
            title="Monthly Burn Rate"
            value={formatCurrency(monthlyBurnRate)}
            icon={Activity}
            trend={{
              value: 12,
              direction: 'down',
              label: 'efficiency gain'
            }}
            insight="Burn rate optimization saves $24K annually"
            action={{
              label: "Optimize Further",
              onClick: () => console.log('Optimize burn rate')
            }}
            startingStage="confidence"
            evolutionSpeed="natural"
            color={{
              trust: theme.colors.secondary,
              confidence: theme.colors.primary,
              intelligence: theme.colors.accent
            }}
          />
        </BreathingContainer>

        {/* Working Capital Efficiency */}
        <BreathingContainer psychologyLevel="confidence" intensity={0.9}>
          <KPIEvolutionCard
            title="Capital Efficiency"
            value={`${(workingCapitalEfficiency * 100).toFixed(1)}%`}
            icon={Zap}
            trend={{
              value: 8,
              direction: workingCapitalEfficiency > 0.5 ? 'up' : 'down',
              label: workingCapitalEfficiency > 0.5 ? 'improving' : 'needs attention'
            }}
            insight="Top 20% efficiency in your industry"
            action={{
              label: "View Details",
              onClick: () => console.log('View efficiency details')
            }}
            startingStage="confidence"
            evolutionSpeed="natural"
          />
        </BreathingContainer>

        {/* Days of Cash */}
        <BreathingContainer psychologyLevel="confidence" intensity={0.7}>
          <KPIEvolutionCard
            title="Cash Runway"
            value={`${daysOfCashInInventory.toFixed(0)}`}
            unit="days"
            icon={Calendar}
            trend={{
              value: 15,
              direction: daysOfCashInInventory < 60 ? 'up' : 'down',
              label: daysOfCashInInventory < 60 ? 'optimal' : 'high'
            }}
            insight={daysOfCashInInventory < 60 ? "Healthy cash velocity" : "Consider inventory reduction"}
            action={{
              label: "Cash Flow Plan",
              onClick: () => console.log('View cash flow plan')
            }}
            startingStage="confidence"
            evolutionSpeed="natural"
          />
        </BreathingContainer>

        {/* Inventory to Sales */}
        <BreathingContainer psychologyLevel="confidence" intensity={0.8}>
          <KPIEvolutionCard
            title="Inventory/Sales"
            value={`${inventoryToSalesRatio.toFixed(1)}x`}
            icon={BarChart3}
            trend={{
              value: 5,
              direction: inventoryToSalesRatio < 2.5 ? 'up' : 'down',
              label: inventoryToSalesRatio < 2.5 ? 'balanced' : 'overstock risk'
            }}
            insight="Optimal range maintains liquidity"
            action={{
              label: "Adjust Levels",
              onClick: () => console.log('Adjust inventory')
            }}
            startingStage="confidence"
            evolutionSpeed="natural"
          />
        </BreathingContainer>
      </div>

      {/* Cash Flow Visualization - Flowing River */}
      <motion.div
        className="rounded-xl p-6 shadow-lg overflow-hidden"
        style={{
          background: theme.colors.background.paper,
          border: `2px solid ${theme.colors.primary}20`
        }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        whileHover={{ 
          scale: 1.01,
          borderColor: theme.colors.primary
        }}
      >
        <h2 
          className="mb-6 flex items-center"
          style={{
            ...theme.typography.title,
            color: theme.colors.primary
          }}
        >
          <DollarSign className="w-6 h-6 mr-3" />
          Cash Flow Analysis
        </h2>
        
        {/* Flowing cash visualization */}
        <div className="relative h-40 mb-8 rounded-lg overflow-hidden" style={{ background: `${theme.colors.primary}05` }}>
          {/* Base flow */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="cashFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.2" />
                <stop offset="50%" stopColor={theme.colors.accent} stopOpacity="0.4" />
                <stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0.2" />
              </linearGradient>
            </defs>
            
            {/* Flowing waves */}
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                fill="url(#cashFlowGradient)"
                initial={{ d: `M 0,${80 + i * 20} Q 200,${80 + i * 20} 400,${80 + i * 20} T 800,${80 + i * 20} L 800,160 L 0,160 Z` }}
                animate={{
                  d: [
                    `M 0,${80 + i * 20} Q 200,${60 + i * 20} 400,${100 + i * 20} T 800,${80 + i * 20} L 800,160 L 0,160 Z`,
                    `M 0,${80 + i * 20} Q 200,${100 + i * 20} 400,${60 + i * 20} T 800,${80 + i * 20} L 800,160 L 0,160 Z`,
                    `M 0,${80 + i * 20} Q 200,${60 + i * 20} 400,${100 + i * 20} T 800,${80 + i * 20} L 800,160 L 0,160 Z`
                  ]
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </svg>
          
          {/* Flow metrics overlay */}
          <div className="relative z-10 h-full flex items-center justify-around px-6">
            {[
              { label: 'Inflow', value: formatCurrency(monthlyBurnRate * 1.2), color: theme.semantic.success.main },
              { label: 'Current', value: formatCurrency(totalInventoryValue), color: theme.colors.primary },
              { label: 'Outflow', value: formatCurrency(monthlyBurnRate), color: theme.colors.accent }
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                className="text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <div 
                  className="font-bold text-xl"
                  style={{ color: metric.color }}
                >
                  {metric.value}
                </div>
                <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Flow indicators */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Velocity', value: 'Optimal', status: 'good' },
            { label: 'Direction', value: 'Positive', status: 'good' },
            { label: 'Stability', value: '94%', status: 'excellent' }
          ].map((indicator, index) => (
            <motion.div
              key={indicator.label}
              className="text-center p-4 rounded-lg"
              style={{
                background: `${theme.colors.primary}10`,
                border: `1px solid ${theme.colors.primary}20`
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              whileHover={{ 
                scale: 1.05,
                backgroundColor: `${theme.colors.primary}20`
              }}
            >
              <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                {indicator.label}
              </div>
              <div 
                className="font-semibold mt-1"
                style={{ 
                  color: indicator.status === 'excellent' ? theme.semantic.success.main : 
                         indicator.status === 'good' ? theme.colors.primary : 
                         theme.semantic.warning.main
                }}
              >
                {indicator.value}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Product Financial Performance - Decision Table */}
      <motion.div
        className="rounded-xl shadow-lg overflow-hidden"
        style={{
          background: theme.colors.background.paper,
          border: `2px solid ${theme.colors.primary}20`
        }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <div 
          className="px-6 py-4"
          style={{
            background: `linear-gradient(90deg, ${theme.colors.primary}10 0%, ${theme.colors.accent}10 100%)`,
            borderBottom: `2px solid ${theme.colors.primary}20`
          }}
        >
          <h2 
            className="flex items-center"
            style={{
              ...theme.typography.title,
              color: theme.colors.primary
            }}
          >
            <TrendingUp className="w-6 h-6 mr-3" />
            Product Financial Performance
          </h2>
          <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
            ROI-driven insights for confident decisions
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ background: `${theme.colors.primary}05` }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.text.secondary }}>
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.text.secondary }}>
                  Value & Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.text.secondary }}>
                  ROI Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.text.secondary }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: `${theme.colors.primary}10` }}>
              {product_performance.slice(0, 5).map((product, index) => {
                const unitCost = product.unit_cost || 10;
                const inventoryValue = product.current_stock * unitCost;
                const roiStatus = product.roi_percentage > 30 ? 'excellent' : 
                                 product.roi_percentage > 15 ? 'good' : 'improve';
                
                return (
                  <motion.tr 
                    key={product.product_id}
                    className="hover:bg-opacity-50"
                    style={{ background: 'transparent' }}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    whileHover={{ 
                      backgroundColor: `${theme.colors.primary}05`,
                      x: 5
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium" style={{ color: theme.colors.text.primary }}>
                          {product.product_name}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.text.muted }}>
                          {product.current_stock} units
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold" style={{ color: theme.colors.primary }}>
                          {formatCurrency(inventoryValue)}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                          {((inventoryValue / totalInventoryValue) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <motion.div
                        animate={{
                          scale: roiStatus === 'excellent' ? [1, 1.05, 1] : 1
                        }}
                        transition={{
                          duration: 2,
                          repeat: roiStatus === 'excellent' ? Infinity : 0
                        }}
                      >
                        <div 
                          className="font-bold"
                          style={{ 
                            color: roiStatus === 'excellent' ? theme.semantic.success.main :
                                   roiStatus === 'good' ? theme.colors.primary :
                                   theme.semantic.warning.main
                          }}
                        >
                          {product.roi_percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                          {roiStatus === 'excellent' ? 'Top Performer' :
                           roiStatus === 'good' ? 'Solid Returns' : 'Optimize'}
                        </div>
                      </motion.div>
                    </td>
                    <td className="px-6 py-4">
                      <motion.button
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: roiStatus === 'excellent' ? theme.semantic.success.surface :
                                     roiStatus === 'good' ? `${theme.colors.primary}10` :
                                     theme.semantic.warning.surface,
                          color: roiStatus === 'excellent' ? theme.semantic.success.main :
                                roiStatus === 'good' ? theme.colors.primary :
                                theme.semantic.warning.main,
                          border: `1px solid ${
                            roiStatus === 'excellent' ? theme.semantic.success.main :
                            roiStatus === 'good' ? theme.colors.primary :
                            theme.semantic.warning.main
                          }20`
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {roiStatus === 'excellent' ? 'Scale Up' :
                         roiStatus === 'good' ? 'Maintain' : 'Review'}
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Financial Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Optimization Opportunities */}
        <motion.div
          className="rounded-xl p-6 shadow-lg"
          style={{
            background: theme.colors.background.paper,
            border: `2px solid ${theme.colors.primary}20`
          }}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ 
            scale: 1.02,
            borderColor: theme.colors.primary
          }}
        >
          <h3 
            className="mb-4 flex items-center"
            style={{
              ...theme.typography.title,
              fontSize: '1.25rem',
              color: theme.colors.primary
            }}
          >
            <Zap className="w-5 h-5 mr-2" />
            Cash Optimization Opportunities
          </h3>
          
          <div className="space-y-3">
            {[
              { 
                title: 'Quick Wins Available',
                description: `${product_performance.filter(p => p.inventory_turnover < 2).length} slow movers can free ${formatCurrency(50000)}`,
                impact: 'high',
                icon: '🎯'
              },
              {
                title: 'Payment Terms Optimization',
                description: 'Extend payables by 10 days for better cash flow',
                impact: 'medium',
                icon: '📅'
              },
              {
                title: 'Inventory Velocity',
                description: 'Target 4x turnover for 20% efficiency gain',
                impact: 'high',
                icon: '⚡'
              }
            ].map((opportunity, index) => (
              <motion.div
                key={opportunity.title}
                className="p-4 rounded-lg cursor-pointer"
                style={{
                  background: opportunity.impact === 'high' ? 
                    `linear-gradient(135deg, ${theme.semantic.success.surface} 0%, ${theme.colors.primary}10 100%)` :
                    `${theme.colors.primary}05`,
                  border: `1px solid ${opportunity.impact === 'high' ? theme.semantic.success.main : theme.colors.primary}20`
                }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                whileHover={{
                  x: 10,
                  scale: 1.02,
                  backgroundColor: opportunity.impact === 'high' ? 
                    theme.semantic.success.surface : 
                    `${theme.colors.primary}10`
                }}
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{opportunity.icon}</div>
                  <div className="flex-1">
                    <p 
                      className="font-semibold mb-1"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {opportunity.title}
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {opportunity.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Payment Intelligence */}
        <motion.div
          className="rounded-xl p-6 shadow-lg"
          style={{
            background: theme.colors.background.paper,
            border: `2px solid ${theme.colors.primary}20`
          }}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ 
            scale: 1.02,
            borderColor: theme.colors.primary
          }}
        >
          <h3 
            className="mb-4 flex items-center"
            style={{
              ...theme.typography.title,
              fontSize: '1.25rem',
              color: theme.colors.primary
            }}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Payment Intelligence
          </h3>
          
          <div className="space-y-4">
            {/* Payment schedule visualization */}
            <div className="relative">
              {/* Timeline */}
              <div 
                className="absolute top-0 left-8 bottom-0 w-0.5"
                style={{ background: `${theme.colors.primary}20` }}
              />
              
              {[
                { days: 5, amount: 25000, status: 'upcoming', supplier: 'Supplier A' },
                { days: 12, amount: 18000, status: 'planned', supplier: 'Supplier B' },
                { days: 20, amount: 32000, status: 'scheduled', supplier: 'Supplier C' }
              ].map((payment, index) => (
                <motion.div
                  key={index}
                  className="relative flex items-center mb-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                >
                  {/* Timeline dot */}
                  <motion.div
                    className="absolute left-6 w-4 h-4 rounded-full"
                    style={{
                      background: payment.status === 'upcoming' ? theme.semantic.warning.main :
                                 payment.status === 'planned' ? theme.colors.primary :
                                 theme.colors.accent,
                      border: `2px solid white`,
                      boxShadow: `0 0 0 4px ${
                        payment.status === 'upcoming' ? theme.semantic.warning.surface :
                        payment.status === 'planned' ? `${theme.colors.primary}20` :
                        `${theme.colors.accent}20`
                      }`
                    }}
                    animate={{
                      scale: payment.status === 'upcoming' ? [1, 1.2, 1] : 1
                    }}
                    transition={{
                      duration: 2,
                      repeat: payment.status === 'upcoming' ? Infinity : 0
                    }}
                  />
                  
                  {/* Payment info */}
                  <div 
                    className="ml-12 flex-1 p-3 rounded-lg"
                    style={{
                      background: payment.status === 'upcoming' ? theme.semantic.warning.surface :
                                 `${theme.colors.primary}05`,
                      border: `1px solid ${
                        payment.status === 'upcoming' ? theme.semantic.warning.main :
                        theme.colors.primary
                      }20`
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p 
                          className="font-medium"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {payment.supplier}
                        </p>
                        <p 
                          className="text-sm"
                          style={{ 
                            color: payment.status === 'upcoming' ? 
                              theme.semantic.warning.main : 
                              theme.colors.text.secondary 
                          }}
                        >
                          Due in {payment.days} days
                        </p>
                      </div>
                      <div 
                        className="font-semibold"
                        style={{ color: theme.colors.primary }}
                      >
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Financial Actions - Decision Center */}
      <motion.div
        className="rounded-xl p-6 shadow-lg"
        style={{
          background: theme.colors.background.paper,
          border: `2px solid ${theme.colors.primary}20`
        }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <h3 
          className="mb-6"
          style={{
            ...theme.typography.title,
            color: theme.colors.primary
          }}
        >
          Financial Decision Center
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, title: 'Cash Flow Forecast', description: 'Project 90-day outlook' },
            { icon: TrendingUp, title: 'ROI Deep Dive', description: 'Product profitability analysis' },
            { icon: Calendar, title: 'Payment Optimizer', description: 'Optimize payment timing' },
            { icon: BarChart3, title: 'Scenario Planning', description: 'What-if analysis tools' }
          ].map((action, index) => (
            <motion.button
              key={action.title}
              className="p-5 text-left rounded-xl transition-all"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}05 0%, ${theme.colors.accent}05 100%)`,
                border: `2px solid ${theme.colors.primary}20`
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
              whileHover={{
                scale: 1.05,
                backgroundColor: `${theme.colors.primary}10`,
                borderColor: theme.colors.primary,
                y: -5
              }}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon 
                className="w-8 h-8 mb-3"
                style={{ color: theme.colors.primary }}
              />
              <p 
                className="font-semibold mb-1"
                style={{ color: theme.colors.text.primary }}
              >
                {action.title}
              </p>
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                {action.description}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Cash Flow Alert - Confidence Building */}
      <AnimatePresence>
        {daysOfCashInInventory > 90 && (
          <motion.div
            className="relative rounded-xl p-6 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${theme.semantic.warning.main} 0%, ${theme.colors.primary} 100%)`,
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            {/* Pulsing background */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 70% 50%, white 0%, transparent 50%)',
                opacity: 0.1
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
            />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center">
                <motion.div 
                  className="text-3xl mr-4"
                  animate={{
                    rotate: [0, -10, 10, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  <DollarSign className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <h4 
                    className="font-semibold text-lg mb-1 text-white"
                  >
                    Cash Flow Optimization Available
                  </h4>
                  <p className="text-white opacity-90">
                    You have {daysOfCashInInventory.toFixed(0)} days of cash in inventory. 
                    We can help optimize this to improve liquidity by 30%.
                  </p>
                </div>
              </div>
              <motion.button 
                className="bg-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                style={{ color: theme.colors.primary }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                Optimize Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
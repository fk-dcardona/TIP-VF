'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PsychologyTheme } from '@/theme/psychology-theme';
import WaterFlowBackground from '@/components/magic/WaterFlowBackground';
import BreathingContainer from '@/components/magic/BreathingContainer';
import KPIEvolutionCard from '@/components/psychology/KPIEvolutionCard';
import { 
  Activity, Package, TrendingUp, AlertTriangle, 
  Zap, Target, BarChart3, Clock, ArrowRight,
  CheckCircle, XCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GeneralManagerDashboardSkeleton } from '@/components/ui/skeleton';

interface OperationalDashboardProps {
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
}

export default function IntelligenceOperationalDashboard({ 
  data, 
  onDataUpdate, 
  loading = false, 
  error = null,
  isRetrying = false
}: OperationalDashboardProps) {
  const [sparklePositions, setSparklePositions] = useState<{x: number, y: number}[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const theme = PsychologyTheme.intelligence;
  
  // Generate sparkle positions for intelligence effect
  useEffect(() => {
    const generateSparkles = () => {
      const positions = Array.from({ length: 5 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setSparklePositions(positions);
    };
    
    generateSparkles();
    const interval = setInterval(generateSparkles, theme.animations.sparkle.duration);
    return () => clearInterval(interval);
  }, [theme.animations.sparkle.duration]);
  
  // Show loading state
  if (loading && !data) {
    return <GeneralManagerDashboardSkeleton />;
  }
  
  // Show error state with action-oriented messaging
  if (error && !data) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Action Required</AlertTitle>
        <AlertDescription className="text-red-700">
          Unable to load operational data. Take action to restore connection.
          {onDataUpdate && (
            <div className="mt-4">
              <Button 
                onClick={onDataUpdate} 
                disabled={isRetrying}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Restore Connection
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
  const summary = data?.summary || {};
  const product_performance = data?.product_performance || [];
  const inventory_alerts = data?.inventory_alerts || [];
  const key_metrics = data?.key_metrics || {};
  const recommendations = data?.recommendations || [];
  
  // Operational metrics
  const criticalAlerts = inventory_alerts.filter(alert => alert.alert_level === 'critical');
  const warningAlerts = inventory_alerts.filter(alert => alert.alert_level === 'warning');
  const totalAlerts = inventory_alerts.length;
  const healthScore = summary?.overall_health_score || 0;
  
  // Group alerts by type for quick action
  const alertsByType = {
    stockout: inventory_alerts.filter(a => a.alert_type === 'stockout'),
    overstock: inventory_alerts.filter(a => a.alert_type === 'overstock'),
    reorder: inventory_alerts.filter(a => a.alert_type === 'reorder_point')
  };
  
  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'stockout': return XCircle;
      case 'overstock': return AlertTriangle;
      case 'reorder_point': return RefreshCw;
      default: return AlertCircle;
    }
  };

  return (
    <motion.div 
      className="space-y-4 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: theme.animations.transition.quick / 1000 }}
    >
      {/* Sparkling background for intelligence */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {sparklePositions.map((pos, index) => (
          <motion.div
            key={index}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              background: theme.colors.accent
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: theme.animations.sparkle.duration / 1000,
              delay: index * 0.2,
              repeat: Infinity
            }}
          />
        ))}
      </div>
      
      {/* Operational Command Center - Intelligence Active */}
      <motion.div
        className="relative rounded-lg p-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
          boxShadow: `0 4px 12px ${theme.colors.primary}30`
        }}
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: theme.animations.transition.quick / 1000 }}
      >
        {/* Quick pulse overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${theme.colors.accent}20 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: theme.animations.sparkle.duration / 1000,
            repeat: Infinity
          }}
        />
        
        <div className="relative z-10 flex items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 
              className="text-xl font-semibold mb-1"
              style={{ color: 'white' }}
            >
              Operational Intelligence Center
            </h1>
            <p className="text-sm" style={{ color: theme.colors.surface, opacity: 0.9 }}>
              Real-time actions and immediate insights
            </p>
          </motion.div>
          
          <motion.div 
            className="text-right"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-2xl font-bold text-white">
              {healthScore}%
            </div>
            <div className="text-sm" style={{ color: theme.colors.surface }}>
              System Health
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Action Alerts - Immediate Response */}
      {totalAlerts > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: theme.animations.transition.quick / 1000, delay: 0.1 }}
        >
          {Object.entries(alertsByType).map(([type, alerts], index) => {
            if (alerts.length === 0) return null;
            const Icon = getAlertIcon(type);
            const isStockout = type === 'stockout';
            const isOverstock = type === 'overstock';
            
            return (
              <motion.div
                key={type}
                className="relative rounded-lg p-4 cursor-pointer"
                style={{
                  background: isStockout ? theme.semantic.error.surface : 
                             isOverstock ? theme.semantic.warning.surface :
                             theme.semantic.info.surface,
                  border: `2px solid ${isStockout ? theme.semantic.error.main : 
                                      isOverstock ? theme.semantic.warning.main :
                                      theme.semantic.info.main}`
                }}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: `0 8px 20px ${theme.colors.primary}20`
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAction(type)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon 
                      className="w-5 h-5 mr-2"
                      style={{ 
                        color: isStockout ? theme.semantic.error.main : 
                               isOverstock ? theme.semantic.warning.main :
                               theme.semantic.info.main
                      }}
                    />
                    <div>
                      <p 
                        className="font-semibold"
                        style={{ 
                          color: isStockout ? theme.semantic.error.dark : 
                                 isOverstock ? theme.semantic.warning.dark :
                                 theme.semantic.info.dark
                        }}
                      >
                        {alerts.length} {type.charAt(0).toUpperCase() + type.slice(1)}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                        Immediate action required
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Real-time KPIs - Intelligence Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Alerts */}
        <BreathingContainer psychologyLevel="intelligence" intensity={0.5}>
          <KPIEvolutionCard
            title="Active Alerts"
            value={totalAlerts}
            icon={AlertTriangle}
            trend={{
              value: criticalAlerts.length,
              direction: criticalAlerts.length > 0 ? 'down' : 'neutral',
              label: criticalAlerts.length > 0 ? 'critical' : 'all monitored'
            }}
            insight={totalAlerts === 0 ? "All systems optimal" : `${criticalAlerts.length} require immediate action`}
            action={{
              label: "Resolve Now",
              onClick: () => console.log('Resolve alerts')
            }}
            startingStage="intelligence"
            evolutionSpeed="fast"
            color={{
              trust: theme.semantic.error.dark,
              confidence: theme.semantic.warning.main,
              intelligence: totalAlerts === 0 ? theme.semantic.success.main : theme.semantic.error.main
            }}
          />
        </BreathingContainer>

        {/* Processing Speed */}
        <BreathingContainer psychologyLevel="intelligence" intensity={0.6}>
          <KPIEvolutionCard
            title="Processing Speed"
            value="1.2"
            unit="s"
            icon={Zap}
            trend={{
              value: 15,
              direction: 'up',
              label: 'faster today'
            }}
            insight="System performing 15% above baseline"
            action={{
              label: "Optimize",
              onClick: () => console.log('Optimize speed')
            }}
            startingStage="intelligence"
            evolutionSpeed="fast"
          />
        </BreathingContainer>

        {/* Active Products */}
        <BreathingContainer psychologyLevel="intelligence" intensity={0.4}>
          <KPIEvolutionCard
            title="Active SKUs"
            value={key_metrics?.total_products || 0}
            icon={Package}
            trend={{
              value: 8,
              direction: 'up',
              label: 'new this week'
            }}
            insight="Portfolio expanding efficiently"
            action={{
              label: "Manage",
              onClick: () => console.log('Manage products')
            }}
            startingStage="intelligence"
            evolutionSpeed="fast"
          />
        </BreathingContainer>

        {/* Efficiency Score */}
        <BreathingContainer psychologyLevel="intelligence" intensity={0.5}>
          <KPIEvolutionCard
            title="Efficiency"
            value="94"
            unit="%"
            icon={Target}
            trend={{
              value: 3,
              direction: 'up',
              label: 'improvement'
            }}
            insight="Operations running at peak performance"
            action={{
              label: "Details",
              onClick: () => console.log('View efficiency')
            }}
            startingStage="intelligence"
            evolutionSpeed="fast"
          />
        </BreathingContainer>
      </div>

      {/* Real-time Product Performance Grid */}
      <motion.div
        className="rounded-lg shadow-sm overflow-hidden"
        style={{
          background: theme.colors.background.paper,
          border: `1px solid ${theme.colors.primary}20`
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: theme.animations.transition.quick / 1000, delay: 0.2 }}
      >
        <div 
          className="px-4 py-3"
          style={{
            background: `linear-gradient(90deg, ${theme.colors.primary}10 0%, ${theme.colors.accent}10 100%)`,
            borderBottom: `1px solid ${theme.colors.primary}20`
          }}
        >
          <h2 
            className="text-lg font-semibold flex items-center"
            style={{ color: theme.colors.primary }}
          >
            <Activity className="w-5 h-5 mr-2" />
            Live Product Intelligence
          </h2>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {product_performance.slice(0, 6).map((product, index) => {
              const isHighPerformer = product.roi_percentage > 30;
              const needsAttention = product.inventory_turnover < 2;
              const stockLevel = (product.current_stock / (product.reorder_point || 100)) * 100;
              
              return (
                <motion.div
                  key={product.product_id}
                  className="relative p-3 rounded-lg cursor-pointer"
                  style={{
                    background: needsAttention ? theme.semantic.warning.surface : 
                               isHighPerformer ? theme.semantic.success.surface : 
                               `${theme.colors.primary}05`,
                    border: `1px solid ${needsAttention ? theme.semantic.warning.main : 
                                        isHighPerformer ? theme.semantic.success.main : 
                                        theme.colors.primary}20`
                  }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: `0 4px 12px ${theme.colors.primary}20`
                  }}
                >
                  {/* Performance indicator */}
                  <motion.div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{
                      background: isHighPerformer ? theme.semantic.success.main : 
                                 needsAttention ? theme.semantic.warning.main : 
                                 theme.colors.primary
                    }}
                    animate={{
                      scale: needsAttention ? [1, 1.5, 1] : 1,
                      opacity: needsAttention ? [1, 0.5, 1] : 1
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: needsAttention ? Infinity : 0
                    }}
                  />
                  
                  <div className="mb-2">
                    <p 
                      className="font-semibold text-sm"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {product.product_name}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      SKU: {product.product_id}
                    </p>
                  </div>
                  
                  {/* Quick metrics */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p style={{ color: theme.colors.text.muted }}>Stock</p>
                      <p 
                        className="font-semibold"
                        style={{ 
                          color: stockLevel < 30 ? theme.semantic.error.main : 
                                 stockLevel < 60 ? theme.semantic.warning.main : 
                                 theme.semantic.success.main
                        }}
                      >
                        {stockLevel.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ color: theme.colors.text.muted }}>ROI</p>
                      <p 
                        className="font-semibold"
                        style={{ color: theme.colors.primary }}
                      >
                        {product.roi_percentage.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ color: theme.colors.text.muted }}>Turn</p>
                      <p 
                        className="font-semibold"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {product.inventory_turnover.toFixed(1)}x
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick action button */}
                  <motion.button
                    className="mt-2 w-full py-1 rounded text-xs font-medium"
                    style={{
                      background: theme.colors.primary,
                      color: 'white'
                    }}
                    whileHover={{ 
                      backgroundColor: theme.colors.secondary
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {needsAttention ? 'Take Action' : 'View Details'}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Intelligence Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Recommendations */}
        <motion.div
          className="rounded-lg p-4"
          style={{
            background: theme.colors.background.paper,
            border: `1px solid ${theme.colors.primary}20`
          }}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: theme.animations.transition.quick / 1000, delay: 0.3 }}
        >
          <h3 
            className="text-lg font-semibold mb-3 flex items-center"
            style={{ color: theme.colors.primary }}
          >
            <Zap className="w-5 h-5 mr-2" />
            Quick Actions
          </h3>
          
          <div className="space-y-2">
            {recommendations.slice(0, 5).map((rec, index) => (
              <motion.div
                key={index}
                className="flex items-center p-2 rounded-lg cursor-pointer"
                style={{
                  background: `${theme.colors.primary}05`,
                  border: `1px solid ${theme.colors.primary}10`
                }}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
                whileHover={{
                  backgroundColor: `${theme.colors.primary}10`,
                  x: 5
                }}
              >
                <motion.div
                  className="w-6 h-6 rounded-full flex items-center justify-center mr-3"
                  style={{
                    background: theme.colors.primary,
                    color: 'white'
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  <CheckCircle className="w-4 h-4" />
                </motion.div>
                <p 
                  className="text-sm flex-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  {rec}
                </p>
                <ArrowRight 
                  className="w-4 h-4"
                  style={{ color: theme.colors.primary }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          className="rounded-lg p-4"
          style={{
            background: theme.colors.background.paper,
            border: `1px solid ${theme.colors.primary}20`
          }}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: theme.animations.transition.quick / 1000, delay: 0.3 }}
        >
          <h3 
            className="text-lg font-semibold mb-3 flex items-center"
            style={{ color: theme.colors.primary }}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Performance Pulse
          </h3>
          
          <div className="space-y-3">
            {[
              { label: 'Order Fulfillment', value: 98, target: 95, unit: '%' },
              { label: 'Inventory Accuracy', value: 99.5, target: 99, unit: '%' },
              { label: 'Cycle Time', value: 2.1, target: 3, unit: 'days' },
              { label: 'Cost per Order', value: 12.50, target: 15, unit: '$' }
            ].map((metric, index) => {
              const isAboveTarget = metric.unit === 'days' || metric.unit === '$' ? 
                metric.value <= metric.target : metric.value >= metric.target;
              
              return (
                <motion.div
                  key={metric.label}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p 
                        className="text-sm"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {metric.label}
                      </p>
                      <p 
                        className="text-sm font-semibold"
                        style={{ 
                          color: isAboveTarget ? theme.semantic.success.main : theme.semantic.warning.main
                        }}
                      >
                        {metric.value}{metric.unit}
                      </p>
                    </div>
                    <div 
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: `${theme.colors.primary}20` }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ 
                          background: isAboveTarget ? theme.semantic.success.main : theme.semantic.warning.main
                        }}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${metric.unit === '%' ? metric.value : (metric.target / metric.value) * 100}%`
                        }}
                        transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Command Actions - Instant Response */}
      <motion.div
        className="rounded-lg p-4"
        style={{
          background: theme.colors.background.paper,
          border: `1px solid ${theme.colors.primary}20`
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: theme.animations.transition.quick / 1000, delay: 0.4 }}
      >
        <h3 
          className="text-lg font-semibold mb-3"
          style={{ color: theme.colors.primary }}
        >
          Intelligence Commands
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Package, title: 'Inventory Scan', time: '2 sec' },
            { icon: TrendingUp, title: 'Sales Analysis', time: '5 sec' },
            { icon: AlertTriangle, title: 'Risk Detection', time: '1 sec' },
            { icon: Target, title: 'Optimization', time: '3 sec' }
          ].map((command, index) => (
            <motion.button
              key={command.title}
              className="p-3 text-center rounded-lg transition-all"
              style={{
                background: `${theme.colors.primary}05`,
                border: `1px solid ${theme.colors.primary}20`
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
              whileHover={{
                scale: 1.05,
                backgroundColor: theme.colors.primary,
                color: 'white'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <command.icon 
                className="w-6 h-6 mx-auto mb-2"
                style={{ color: 'currentColor' }}
              />
              <p className="text-sm font-medium">
                {command.title}
              </p>
              <p 
                className="text-xs mt-1"
                style={{ opacity: 0.7 }}
              >
                {command.time}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Real-time Status Bar */}
      <motion.div
        className="flex items-center justify-between p-3 rounded-lg"
        style={{
          background: `linear-gradient(90deg, ${theme.colors.primary}10 0%, ${theme.colors.accent}10 100%)`,
          border: `1px solid ${theme.colors.primary}20`
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: theme.animations.transition.quick / 1000, delay: 0.6 }}
      >
        <div className="flex items-center">
          <motion.div
            className="w-2 h-2 rounded-full mr-2"
            style={{ background: theme.semantic.success.main }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
          <p 
            className="text-sm"
            style={{ color: theme.colors.text.secondary }}
          >
            All systems operational • Last update: <Clock className="inline w-3 h-3" /> Now
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          style={{ color: theme.colors.primary }}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </motion.div>
    </motion.div>
  );
}
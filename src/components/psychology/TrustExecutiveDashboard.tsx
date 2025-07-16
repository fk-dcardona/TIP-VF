'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PsychologyTheme } from '@/theme/psychology-theme';
import BreathingContainer from '@/components/magic/BreathingContainer';
import KPIEvolutionCard from '@/components/psychology/KPIEvolutionCard';
import { Activity, AlertTriangle, DollarSign, Package, Target, TrendingUp } from 'lucide-react';

interface ExecutiveDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
  };
}

export default function TrustExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [breathPhase, setBreathPhase] = useState(0);
  
  const theme = PsychologyTheme.trust;
  const { summary, product_performance, inventory_alerts, financial_insights, key_metrics, recommendations } = data;
  
  // Calculate key executive metrics
  const criticalIssues = inventory_alerts.filter(alert => alert.alert_level === 'critical').length;
  const topProducts = product_performance.slice(0, 3);
  const healthScore = summary?.overall_health_score || 0;
  const totalValue = financial_insights?.total_inventory_value || 0;
  
  // Natural breathing cycle for trust foundation
  useEffect(() => {
    let animationFrame: number;
    const startTime = Date.now();
    
    const breathe = () => {
      const elapsed = Date.now() - startTime;
      const phase = (elapsed / theme.animations.breath.duration) * 2 * Math.PI;
      
      // Natural breathing curve - slower inhale, faster exhale
      const breathCurve = Math.sin(phase);
      const naturalBreath = breathCurve > 0 
        ? Math.pow(breathCurve, 0.7)  // Slower inhale
        : -Math.pow(-breathCurve, 1.3); // Faster exhale
      
      setBreathPhase(naturalBreath);
      animationFrame = requestAnimationFrame(breathe);
    };
    
    breathe();
    return () => cancelAnimationFrame(animationFrame);
  }, [theme.animations.breath.duration]);
  
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return { text: theme.semantic.success.main, bg: theme.semantic.success.surface };
    if (score >= 60) return { text: theme.semantic.warning.main, bg: theme.semantic.warning.surface };
    return { text: theme.semantic.error.main, bg: theme.semantic.error.surface };
  };
  
  const getHealthScoreText = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'NEEDS ATTENTION';
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: theme.animations.transition.entrance / 1000 }}
    >
      {/* Executive Summary Header - Trust Foundation */}
      <motion.div
        className="relative rounded-2xl p-8 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
          boxShadow: `0 20px 40px ${theme.colors.primary}30`
        }}
        animate={{
          boxShadow: [
            `0 20px 40px ${theme.colors.primary}30`,
            `0 25px 50px ${theme.colors.primary}40`,
            `0 20px 40px ${theme.colors.primary}30`
          ]
        }}
        transition={{
          duration: theme.animations.breath.duration / 1000,
          repeat: Infinity,
          ease: theme.animations.breath.easing
        }}
      >
        {/* Breathing overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${theme.colors.accent}20 0%, transparent 50%)`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: theme.animations.breath.duration / 1000,
            repeat: Infinity
          }}
        />
        
        <div className="relative z-10 flex items-center justify-between">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 
              className="mb-2"
              style={{
                ...theme.typography.hero,
                color: 'white'
              }}
            >
              EXECUTIVE COMMAND CENTER
            </h1>
            <p 
              className="opacity-90"
              style={{ color: theme.colors.surface }}
            >
              Strategic oversight with absolute clarity
            </p>
          </motion.div>
          
          <motion.div 
            className="text-right"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div 
              className="font-black"
              style={{ 
                fontSize: 'clamp(2.5rem, 4vw, 3rem)',
                color: 'white',
                letterSpacing: '-0.02em'
              }}
            >
              ${(totalValue / 1000).toFixed(0)}K
            </div>
            <div style={{ color: theme.colors.surface, opacity: 0.9 }}>
              TOTAL INVENTORY VALUE
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Key Performance Indicators - Trust Building Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Supply Chain Health Score */}
        <BreathingContainer psychologyLevel="trust" intensity={1}>
          <KPIEvolutionCard
            title="HEALTH SCORE"
            value={healthScore}
            unit="/100"
            icon={Target}
            trend={{
              value: 8,
              direction: healthScore > 70 ? 'up' : 'down',
              label: 'vs last period'
            }}
            insight="Supply chain stability indicates strong operational foundation"
            action={{
              label: "View Details",
              onClick: () => console.log('View health details')
            }}
            startingStage="trust"
            evolutionSpeed="slow"
            color={{
              trust: theme.colors.primary,
              confidence: theme.colors.secondary,
              intelligence: theme.colors.accent
            }}
          />
        </BreathingContainer>

        {/* Critical Issues */}
        <BreathingContainer psychologyLevel="trust" intensity={0.9}>
          <KPIEvolutionCard
            title="CRITICAL ISSUES"
            value={criticalIssues}
            icon={AlertTriangle}
            trend={{
              value: criticalIssues * 10,
              direction: criticalIssues === 0 ? 'neutral' : 'down',
              label: criticalIssues === 0 ? 'All Clear' : 'Needs Attention'
            }}
            insight={criticalIssues === 0 ? "Operations running smoothly" : "Immediate action required on critical items"}
            action={{
              label: "Review Issues",
              onClick: () => console.log('Review critical issues')
            }}
            startingStage="trust"
            evolutionSpeed="slow"
            color={{
              trust: criticalIssues === 0 ? theme.semantic.success.dark : theme.semantic.error.dark,
              confidence: criticalIssues === 0 ? theme.semantic.success.main : theme.semantic.error.main,
              intelligence: criticalIssues === 0 ? theme.semantic.success.light : theme.semantic.error.light
            }}
          />
        </BreathingContainer>

        {/* Working Capital Efficiency */}
        <BreathingContainer psychologyLevel="trust" intensity={0.8}>
          <KPIEvolutionCard
            title="CAPITAL EFFICIENCY"
            value={(financial_insights?.working_capital_efficiency || 0).toFixed(1)}
            unit="x"
            icon={DollarSign}
            trend={{
              value: 12,
              direction: 'up',
              label: 'improvement'
            }}
            insight="Strong capital deployment indicates healthy cash flow"
            action={{
              label: "Optimize Further",
              onClick: () => console.log('Optimize capital')
            }}
            startingStage="trust"
            evolutionSpeed="slow"
          />
        </BreathingContainer>

        {/* Active Products */}
        <BreathingContainer psychologyLevel="trust" intensity={0.7}>
          <KPIEvolutionCard
            title="ACTIVE PRODUCTS"
            value={key_metrics?.total_products || 0}
            icon={Package}
            trend={{
              value: 5,
              direction: 'up',
              label: 'portfolio growth'
            }}
            insight="Diversified portfolio reduces supply chain risk"
            action={{
              label: "Manage Portfolio",
              onClick: () => console.log('Manage products')
            }}
            startingStage="trust"
            evolutionSpeed="slow"
          />
        </BreathingContainer>
      </div>

      {/* Strategic Insights - Deep Trust Building */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Products */}
        <motion.div
          className="rounded-xl p-8 shadow-xl"
          style={{
            background: theme.colors.background.paper,
            border: `2px solid ${theme.colors.primary}10`
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ 
            scale: 1.01,
            boxShadow: `0 10px 40px ${theme.colors.primary}20`
          }}
        >
          <h2 
            className="mb-6 flex items-center"
            style={{
              ...theme.typography.title,
              color: theme.colors.primary
            }}
          >
            <Target className="w-6 h-6 mr-3" />
            TOP PERFORMING PRODUCTS
          </h2>
          
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <motion.div
                key={product.product_id}
                className="p-4 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}05 0%, ${theme.colors.secondary}05 100%)`,
                  border: `1px solid ${theme.colors.primary}10`
                }}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: theme.colors.primary
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4"
                      style={{
                        background: index === 0 ? theme.colors.primary : 
                                  index === 1 ? theme.colors.secondary : 
                                  theme.colors.accent
                      }}
                      animate={{
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2,
                        delay: index * 0.3,
                        repeat: Infinity
                      }}
                    >
                      {index + 1}
                    </motion.div>
                    <div>
                      <p 
                        className="font-semibold"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {product.product_name}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        ROI: {product.roi_percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p 
                      className="text-sm font-semibold"
                      style={{ color: theme.semantic.success.main }}
                    >
                      {product.sales_velocity.toFixed(1)} units/day
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: theme.colors.text.muted }}
                    >
                      {product.days_of_stock} days stock
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Strategic Recommendations */}
        <motion.div
          className="rounded-xl p-8 shadow-xl"
          style={{
            background: theme.colors.background.paper,
            border: `2px solid ${theme.colors.primary}10`
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          whileHover={{ 
            scale: 1.01,
            boxShadow: `0 10px 40px ${theme.colors.primary}20`
          }}
        >
          <h2 
            className="mb-6 flex items-center"
            style={{
              ...theme.typography.title,
              color: theme.colors.primary
            }}
          >
            <Activity className="w-6 h-6 mr-3" />
            STRATEGIC IMPERATIVES
          </h2>
          
          <div className="space-y-4">
            {recommendations.slice(0, 4).map((recommendation, index) => (
              <motion.div
                key={index}
                className="flex items-start p-4 rounded-lg"
                style={{
                  background: `${theme.colors.primary}05`,
                  border: `1px solid ${theme.colors.primary}20`
                }}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
                whileHover={{
                  backgroundColor: `${theme.colors.primary}10`,
                  x: 5
                }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                  style={{
                    background: theme.colors.primary,
                    color: 'white'
                  }}
                  animate={{
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    delay: index * 0.5,
                    repeat: Infinity
                  }}
                >
                  <span className="font-bold text-sm">{index + 1}</span>
                </motion.div>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: theme.colors.text.primary }}
                >
                  {recommendation}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Financial Overview - Authority through Numbers */}
      <motion.div
        className="rounded-xl p-8 shadow-xl"
        style={{
          background: theme.colors.background.paper,
          border: `2px solid ${theme.colors.primary}10`
        }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <h2 
          className="mb-8 flex items-center"
          style={{
            ...theme.typography.title,
            color: theme.colors.primary
          }}
        >
          <DollarSign className="w-6 h-6 mr-3" />
          FINANCIAL COMMAND VIEW
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'TOTAL INVENTORY VALUE',
              value: `$${(financial_insights?.total_inventory_value || 0).toLocaleString()}`,
              subtext: 'Capital deployed',
              color: theme.semantic.success.main,
              bg: theme.semantic.success.surface
            },
            {
              label: 'MONTHLY BURN RATE',
              value: `$${(financial_insights?.monthly_burn_rate || 0).toLocaleString()}`,
              subtext: 'Consumption velocity',
              color: theme.colors.primary,
              bg: `${theme.colors.primary}10`
            },
            {
              label: 'INVENTORY TO SALES',
              value: `${(financial_insights?.inventory_to_sales_ratio || 0).toFixed(1)}x`,
              subtext: 'Efficiency metric',
              color: theme.colors.accent,
              bg: `${theme.colors.accent}10`
            }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              className="text-center p-6 rounded-xl"
              style={{
                background: metric.bg,
                border: `2px solid ${metric.color}20`
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
              whileHover={{
                scale: 1.05,
                borderColor: metric.color
              }}
            >
              <motion.div
                className="font-black mb-2"
                style={{ 
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  color: metric.color
                }}
                animate={{
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 4,
                  delay: index * 0.5,
                  repeat: Infinity
                }}
              >
                {metric.value}
              </motion.div>
              <p 
                className="text-sm font-semibold mb-1"
                style={{ color: theme.colors.text.primary }}
              >
                {metric.label}
              </p>
              <p 
                className="text-xs"
                style={{ color: theme.colors.text.muted }}
              >
                {metric.subtext}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Key Insight Banner - Authoritative Alert */}
      <AnimatePresence>
        {summary?.key_insight && (
          <motion.div
            className="relative rounded-xl p-8 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${theme.semantic.warning.main} 0%, ${theme.semantic.error.main} 100%)`,
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
            />
            
            <div className="relative z-10 flex items-center">
              <motion.div 
                className="text-4xl mr-6"
                animate={{
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity
                }}
              >
                <Target className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h3 
                  className="mb-2"
                  style={{
                    ...theme.typography.title,
                    color: 'white',
                    textTransform: 'uppercase'
                  }}
                >
                  STRATEGIC INSIGHT
                </h3>
                <p 
                  className="text-white opacity-90 text-lg"
                  style={{ lineHeight: 1.6 }}
                >
                  {summary.key_insight}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Command Actions - Authority to Act */}
      <motion.div
        className="rounded-xl p-8 shadow-xl"
        style={{
          background: theme.colors.background.paper,
          border: `2px solid ${theme.colors.primary}10`
        }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
      >
        <h2 
          className="mb-6"
          style={{
            ...theme.typography.title,
            color: theme.colors.primary
          }}
        >
          COMMAND ACTIONS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingUp,
              title: 'DETAILED ANALYTICS',
              description: 'Deep dive into performance metrics',
              color: theme.colors.primary
            },
            {
              icon: Activity,
              title: 'SALES PERFORMANCE',
              description: 'Review team execution metrics',
              color: theme.colors.secondary
            },
            {
              icon: DollarSign,
              title: 'FINANCIAL REPORTS',
              description: 'Cash flow and profitability analysis',
              color: theme.colors.accent
            }
          ].map((action, index) => (
            <motion.button
              key={action.title}
              className="p-6 text-left rounded-xl transition-all"
              style={{
                background: `${action.color}05`,
                border: `2px solid ${action.color}20`
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.8 + index * 0.1 }}
              whileHover={{
                scale: 1.02,
                backgroundColor: `${action.color}10`,
                borderColor: action.color,
                x: 5
              }}
              whileTap={{ scale: 0.98 }}
            >
              <action.icon 
                className="w-8 h-8 mb-4"
                style={{ color: action.color }}
              />
              <p 
                className="font-bold mb-2"
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
    </motion.div>
  );
}
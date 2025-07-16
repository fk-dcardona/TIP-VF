'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PsychologyFlow, getCurrentFlow, PsychologyLevel } from '@/design-system/psychology-flow';
import { FileText, TrendingUp, Zap, Upload, Package, DollarSign } from 'lucide-react';
import KPIEvolutionCard from './KPIEvolutionCard';

export default function LivingOrganismDemo() {
  const [globalPsychology, setGlobalPsychology] = useState<PsychologyLevel>('trust');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [userEngagementTime, setUserEngagementTime] = useState(0);
  
  // Simulate natural time progression
  useEffect(() => {
    const interval = setInterval(() => {
      setUserEngagementTime(prev => prev + 1000);
      
      // Natural psychology progression based on engagement
      if (userEngagementTime > 10000 && globalPsychology === 'trust') {
        setGlobalPsychology('confidence');
      } else if (userEngagementTime > 20000 && globalPsychology === 'confidence') {
        setGlobalPsychology('intelligence');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [userEngagementTime, globalPsychology]);
  
  // Get current flow configuration
  const currentFlow = getCurrentFlow(globalPsychology, { timeOfDay });
  
  // Sample KPIs that demonstrate the psychology flow
  const kpis = [
    {
      title: "Total Documents",
      value: "1,247",
      icon: FileText,
      trend: { value: 23, direction: 'up' as const, label: 'from last month' },
      insight: "Processing speed improved by 15% this week",
      action: { 
        label: "Upload Documents", 
        onClick: () => console.log('Upload clicked') 
      }
    },
    {
      title: "Cash Flow",
      value: "$847K",
      icon: DollarSign,
      trend: { value: 12, direction: 'up' as const, label: 'vs last quarter' },
      insight: "Payment terms optimization could free up $120K",
      action: { 
        label: "Optimize Terms", 
        onClick: () => console.log('Optimize clicked') 
      }
    },
    {
      title: "Supply Health",
      value: "87%",
      unit: "",
      icon: Package,
      trend: { value: 5, direction: 'down' as const, label: 'risk increase' },
      insight: "3 suppliers need immediate attention",
      action: { 
        label: "Review Suppliers", 
        onClick: () => console.log('Review clicked') 
      }
    },
    {
      title: "Automation Rate",
      value: "92%",
      unit: "",
      icon: Zap,
      trend: { value: 8, direction: 'up' as const, label: 'efficiency gain' },
      insight: "Manual processing reduced by 40 hours/week",
      action: { 
        label: "View Details", 
        onClick: () => console.log('Details clicked') 
      }
    }
  ];
  
  return (
    <div className="min-h-screen p-8">
      {/* Living Background */}
      <motion.div
        className="fixed inset-0 -z-10"
        style={{
          background: currentFlow.colors.gradient.rest,
        }}
        animate={{
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: currentFlow.animation.timing.breath / 1000,
          repeat: Infinity,
          ease: currentFlow.animation.easing.breath
        }}
      />
      
      {/* Flow Particles */}
      <AnimatePresence>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: currentFlow.colors.glow,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 2, 0],
              y: globalPsychology === 'trust' ? [0, -100] :
                 globalPsychology === 'confidence' ? [0, -200] :
                 [0, -300],
            }}
            transition={{
              duration: currentFlow.animation.timing.breath / 1000,
              delay: i * 0.2,
              repeat: Infinity,
              ease: currentFlow.animation.easing.primary
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Header showing current psychology state */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 
          className="text-5xl font-bold mb-4"
          style={{ 
            color: currentFlow.colors.primary,
            letterSpacing: currentFlow.typography.spacing.letters,
          }}
        >
          Living Psychology Flow
        </h1>
        
        <div className="flex items-center justify-center space-x-8 mb-8">
          {/* Psychology Level Indicator */}
          <div className="flex items-center space-x-4">
            {(['trust', 'confidence', 'intelligence'] as PsychologyLevel[]).map((level) => (
              <motion.div
                key={level}
                className="relative"
                animate={{
                  scale: globalPsychology === level ? 1.2 : 1,
                }}
              >
                <motion.div
                  className="w-24 h-24 rounded-full flex items-center justify-center font-semibold text-sm"
                  style={{
                    background: globalPsychology === level ? 
                      PsychologyFlow.waters[level].colors.primary : 
                      `${PsychologyFlow.waters[level].colors.primary}20`,
                    color: globalPsychology === level ? 'white' : PsychologyFlow.waters[level].colors.primary,
                    border: `2px solid ${PsychologyFlow.waters[level].colors.primary}`
                  }}
                  animate={globalPsychology === level ? {
                    boxShadow: [
                      `0 0 0 0 ${PsychologyFlow.waters[level].colors.glow}`,
                      `0 0 0 20px transparent`,
                    ]
                  } : {}}
                  transition={{
                    duration: PsychologyFlow.waters[level].animation.timing.breath / 1000,
                    repeat: Infinity,
                  }}
                >
                  {PsychologyFlow.waters[level].name}
                </motion.div>
                
                {/* Flow indicator between levels */}
                {level !== 'intelligence' && (
                  <motion.div
                    className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-0.5"
                    style={{
                      background: `linear-gradient(90deg, 
                        ${PsychologyFlow.waters[level].colors.primary} 0%, 
                        ${PsychologyFlow.waters[level === 'trust' ? 'confidence' : 'intelligence'].colors.primary} 100%)`
                    }}
                    animate={{
                      scaleX: globalPsychology === level ? [0, 1, 0] : 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Current State Description */}
        <motion.p
          className="text-lg max-w-2xl mx-auto"
          style={{ color: currentFlow.colors.primary }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: currentFlow.animation.timing.breath / 1000,
            repeat: Infinity,
          }}
        >
          {globalPsychology === 'trust' && 
            "Building foundation through slow, deliberate breathing. Users establish trust through patient observation."}
          {globalPsychology === 'confidence' && 
            "Flowing forward with purpose. Users gain confidence through understanding trends and patterns."}
          {globalPsychology === 'intelligence' && 
            "Crystal clarity enables swift action. Users make intelligent decisions with complete context."}
        </motion.p>
      </motion.div>
      
      {/* KPI Evolution Cards Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.8 + index * 0.2,
              ease: currentFlow.animation.easing.primary
            }}
          >
            <KPIEvolutionCard
              {...kpi}
              startingStage={globalPsychology}
              evolutionSpeed="natural"
              color={{
                trust: currentFlow.colors.primary,
                confidence: PsychologyFlow.waters.confidence.colors.primary,
                intelligence: PsychologyFlow.waters.intelligence.colors.primary
              }}
            />
          </motion.div>
        ))}
      </motion.div>
      
      {/* Flow Visualization */}
      <motion.div
        className="mt-16 max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <h2 
          className="text-2xl font-semibold mb-8 text-center"
          style={{ color: currentFlow.colors.primary }}
        >
          Psychology Flow Characteristics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Rhythm */}
          <motion.div
            className="p-6 rounded-xl"
            style={{
              background: `${currentFlow.colors.primary}10`,
              border: `1px solid ${currentFlow.colors.primary}30`
            }}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="font-semibold mb-2" style={{ color: currentFlow.colors.primary }}>
              Rhythm: {currentFlow.characteristics.rhythm}
            </h3>
            <p className="text-sm text-gray-600">
              {currentFlow.animation.timing.breath / 1000}s cycle
            </p>
            <motion.div
              className="mt-4 h-2 rounded-full overflow-hidden bg-gray-200"
              style={{ background: `${currentFlow.colors.primary}20` }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: currentFlow.colors.primary }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: currentFlow.animation.timing.breath / 1000,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </motion.div>
          </motion.div>
          
          {/* Movement */}
          <motion.div
            className="p-6 rounded-xl"
            style={{
              background: `${currentFlow.colors.primary}10`,
              border: `1px solid ${currentFlow.colors.primary}30`
            }}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="font-semibold mb-2" style={{ color: currentFlow.colors.primary }}>
              Movement: {currentFlow.characteristics.movement}
            </h3>
            <p className="text-sm text-gray-600">
              {currentFlow.animation.physics.friction} friction
            </p>
            <div className="mt-4 flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="flex-1 h-8 rounded"
                  style={{ background: currentFlow.colors.primary }}
                  animate={{
                    scaleY: [1, 0.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: currentFlow.animation.timing.transition / 1000,
                    delay: i * 0.1,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </motion.div>
          
          {/* Temperature */}
          <motion.div
            className="p-6 rounded-xl"
            style={{
              background: `${currentFlow.colors.primary}10`,
              border: `1px solid ${currentFlow.colors.primary}30`
            }}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="font-semibold mb-2" style={{ color: currentFlow.colors.primary }}>
              Temperature: {currentFlow.characteristics.temperature}
            </h3>
            <p className="text-sm text-gray-600">
              {currentFlow.typography.weight.hero} weight
            </p>
            <motion.div
              className="mt-4 h-8 rounded-lg overflow-hidden"
              style={{
                background: `linear-gradient(90deg, 
                  ${currentFlow.colors.primary}40 0%, 
                  ${currentFlow.colors.secondary} 100%)`
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: currentFlow.animation.timing.breath / 1000,
                repeat: Infinity,
              }}
            />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Time of Day Control */}
      <motion.div
        className="fixed bottom-8 right-8 p-4 rounded-xl bg-white shadow-lg"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <p className="text-sm font-medium mb-2 text-gray-700">Simulate Time of Day</p>
        <div className="flex space-x-2">
          {(['morning', 'afternoon', 'evening', 'night'] as const).map((time) => (
            <button
              key={time}
              onClick={() => setTimeOfDay(time)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timeOfDay === time 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {time.charAt(0).toUpperCase() + time.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Engagement time: {Math.floor(userEngagementTime / 1000)}s
        </p>
      </motion.div>
    </div>
  );
}
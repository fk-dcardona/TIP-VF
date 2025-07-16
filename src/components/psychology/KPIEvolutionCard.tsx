'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreathing } from '@/hooks/useBreathing';
import { LucideIcon } from 'lucide-react';

interface KPIEvolutionCardProps {
  // Core data
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  
  // Evolution data
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  insight?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  
  // Psychology configuration
  startingStage?: 'trust' | 'confidence' | 'intelligence';
  evolutionSpeed?: 'natural' | 'fast' | 'slow';
  color?: {
    trust: string;
    confidence: string;
    intelligence: string;
  };
}

type PsychologyStage = 'trust' | 'confidence' | 'intelligence';

export default function KPIEvolutionCard({
  title,
  value,
  unit = '',
  icon: Icon,
  trend,
  insight,
  action,
  startingStage = 'trust',
  evolutionSpeed = 'natural',
  color = {
    trust: '#060735',      // Deep navy
    confidence: '#2128B1', // Finkargo blue
    intelligence: '#3B82F6' // Bright blue
  }
}: KPIEvolutionCardProps) {
  const [stage, setStage] = useState<PsychologyStage>(startingStage);
  const [userEngagement, setUserEngagement] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const engagementRef = useRef(0);
  const breathing = useBreathing(stage === 'trust' ? 6000 : stage === 'confidence' ? 3000 : 1500);
  
  // Evolution timing based on speed setting
  const evolutionTiming = {
    natural: { trust: 3000, confidence: 6000 },
    fast: { trust: 1500, confidence: 3000 },
    slow: { trust: 6000, confidence: 12000 }
  };
  
  // Track user engagement
  useEffect(() => {
    const interval = setInterval(() => {
      if (isHovered) {
        engagementRef.current += 100;
        setUserEngagement(engagementRef.current);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isHovered]);
  
  // Natural progression through stages
  useEffect(() => {
    const timings = evolutionTiming[evolutionSpeed];
    
    // Progress to confidence after trust period
    if (stage === 'trust' && userEngagement > timings.trust) {
      setStage('confidence');
    }
    
    // Progress to intelligence after confidence period
    if (stage === 'confidence' && userEngagement > timings.confidence) {
      setStage('intelligence');
    }
  }, [userEngagement, stage, evolutionSpeed]);
  
  // Stage-specific styles
  const stageStyles = {
    trust: {
      background: `linear-gradient(135deg, ${color.trust}10 0%, ${color.trust}05 100%)`,
      borderColor: `${color.trust}20`,
      textColor: color.trust,
      scale: breathing.scale,
      opacity: 0.9 + breathing.opacity * 0.1
    },
    confidence: {
      background: `linear-gradient(135deg, ${color.confidence}15 0%, ${color.confidence}10 100%)`,
      borderColor: color.confidence,
      textColor: color.confidence,
      scale: 1 + Math.sin(Date.now() / 2000) * 0.02,
      opacity: 1
    },
    intelligence: {
      background: `linear-gradient(135deg, ${color.intelligence}20 0%, ${color.intelligence}15 100%)`,
      borderColor: color.intelligence,
      textColor: color.intelligence,
      scale: 1,
      opacity: 1
    }
  };
  
  const currentStyle = stageStyles[stage];
  
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border-2 p-6 cursor-pointer"
      style={{
        background: currentStyle.background,
        borderColor: currentStyle.borderColor,
      }}
      animate={{
        scale: currentStyle.scale,
        opacity: currentStyle.opacity,
      }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{
        scale: { duration: 0.3 },
        opacity: { duration: 0.6 }
      }}
    >
      {/* Psychological aura */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentStyle.textColor}10 0%, transparent 70%)`,
        }}
        animate={{
          scale: stage === 'trust' ? [1, 1.2, 1] : 
                 stage === 'confidence' ? [1, 1.1, 1] : 
                 [1, 1.05, 1],
        }}
        transition={{
          duration: stage === 'trust' ? 6 : stage === 'confidence' ? 3 : 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <motion.h3 
          className="text-sm font-medium"
          style={{ color: currentStyle.textColor }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: stage === 'trust' ? 4 : 2,
            repeat: Infinity
          }}
        >
          {title}
        </motion.h3>
        <motion.div
          animate={{
            rotate: stage === 'intelligence' ? [0, 10, -10, 0] : 0,
          }}
          transition={{
            duration: 2,
            repeat: stage === 'intelligence' ? Infinity : 0
          }}
        >
          <Icon 
            className="h-5 w-5" 
            style={{ color: `${currentStyle.textColor}60` }}
          />
        </motion.div>
      </div>
      
      {/* Value - Always visible (Trust foundation) */}
      <motion.div
        className="relative z-10"
        layout
      >
        <motion.div 
          className="text-3xl font-bold flex items-baseline"
          style={{ color: currentStyle.textColor }}
          animate={{
            scale: stage === 'trust' ? breathing.scale : 1,
          }}
        >
          {value}
          {unit && <span className="text-lg ml-1 opacity-70">{unit}</span>}
        </motion.div>
      </motion.div>
      
      {/* Trend - Reveals in Confidence stage */}
      <AnimatePresence>
        {stage !== 'trust' && trend && (
          <motion.div
            className="relative z-10 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-2">
              <motion.span
                className={`text-sm font-medium ${
                  trend.direction === 'up' ? 'text-green-600' :
                  trend.direction === 'down' ? 'text-red-600' :
                  'text-gray-600'
                }`}
                animate={{
                  scale: stage === 'confidence' ? [1, 1.1, 1] : 1
                }}
                transition={{
                  duration: 2,
                  repeat: stage === 'confidence' ? Infinity : 0
                }}
              >
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
                {Math.abs(trend.value)}%
              </motion.span>
              <span className="text-sm text-gray-600">{trend.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Insight & Action - Reveals in Intelligence stage */}
      <AnimatePresence>
        {stage === 'intelligence' && (
          <motion.div
            className="relative z-10 mt-4 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.8 }}
          >
            {insight && (
              <motion.p
                className="text-sm text-gray-600"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.6 }}
              >
                💡 {insight}
              </motion.p>
            )}
            
            {action && (
              <motion.button
                className="text-sm font-medium px-3 py-1 rounded-lg transition-all"
                style={{
                  color: color.intelligence,
                  backgroundColor: `${color.intelligence}10`,
                  border: `1px solid ${color.intelligence}30`
                }}
                whileHover={{
                  backgroundColor: `${color.intelligence}20`,
                  scale: 1.05
                }}
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                initial={{ y: 10 }}
                animate={{ y: 0 }}
              >
                {action.label} →
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stage indicator */}
      <motion.div
        className="absolute bottom-2 right-2 flex space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
      >
        {(['trust', 'confidence', 'intelligence'] as PsychologyStage[]).map((s) => (
          <motion.div
            key={s}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: s === stage ? currentStyle.textColor : `${currentStyle.textColor}20`
            }}
            animate={{
              scale: s === stage ? [1, 1.3, 1] : 1
            }}
            transition={{
              duration: 1,
              repeat: s === stage ? Infinity : 0
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
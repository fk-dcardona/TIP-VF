'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PsychologyFlow, PsychologyLevel } from '@/design-system/psychology-flow';
import { Waves, Heart, Sparkles, ChevronRight } from 'lucide-react';

interface PsychologyFlowIndicatorProps {
  currentLevel: PsychologyLevel;
  userEngagement: number;
  onLevelChange?: (level: PsychologyLevel) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  minimal?: boolean;
}

export default function PsychologyFlowIndicator({
  currentLevel,
  userEngagement,
  onLevelChange,
  position = 'top-right',
  minimal = false
}: PsychologyFlowIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nextLevel, setNextLevel] = useState<PsychologyLevel | null>(null);
  
  const levels: PsychologyLevel[] = ['trust', 'confidence', 'intelligence'];
  const currentIndex = levels.indexOf(currentLevel);
  const flow = PsychologyFlow.waters[currentLevel];
  
  // Calculate progress to next level
  const progressThresholds = {
    trust: 10000,      // 10 seconds to confidence
    confidence: 20000, // 20 seconds to intelligence
    intelligence: Infinity
  };
  
  const progress = Math.min(
    (userEngagement / progressThresholds[currentLevel]) * 100,
    100
  );
  
  // Predict next level
  useEffect(() => {
    if (progress > 80 && currentIndex < levels.length - 1) {
      setNextLevel(levels[currentIndex + 1]);
    } else {
      setNextLevel(null);
    }
  }, [progress, currentIndex]);
  
  const positionClasses = {
    'top-right': 'top-20 right-8',
    'top-left': 'top-20 left-8',
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8'
  };
  
  const icons = {
    trust: Waves,
    confidence: Heart,
    intelligence: Sparkles
  };
  
  const Icon = icons[currentLevel];
  
  if (minimal) {
    return (
      <motion.div
        className={`fixed ${positionClasses[position]} z-50`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: flow.colors.primary,
            boxShadow: `0 0 20px ${flow.colors.glow}`
          }}
          animate={{
            boxShadow: [
              `0 0 20px ${flow.colors.glow}`,
              `0 0 40px ${flow.colors.glow}`,
              `0 0 20px ${flow.colors.glow}`
            ]
          }}
          transition={{
            duration: flow.animation.timing.breath / 1000,
            repeat: Infinity
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-50`}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{
          border: `2px solid ${flow.colors.primary}20`
        }}
        animate={{
          borderColor: [`${flow.colors.primary}20`, `${flow.colors.primary}40`, `${flow.colors.primary}20`]
        }}
        transition={{
          duration: flow.animation.timing.breath / 1000,
          repeat: Infinity
        }}
        whileHover={{ scale: 1.02 }}
        layout
      >
        {/* Header */}
        <motion.div
          className="p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ backgroundColor: `${flow.colors.primary}05` }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity
              }}
            >
              <Icon className="w-5 h-5" style={{ color: flow.colors.primary }} />
            </motion.div>
            <div>
              <h3 className="font-semibold" style={{ color: flow.colors.primary }}>
                {flow.name}
              </h3>
              <p className="text-xs text-gray-500">
                {flow.characteristics.rhythm} • {Math.floor(userEngagement / 1000)}s
              </p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${flow.colors.primary} 0%, ${flow.colors.secondary} 100%)`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Next level hint */}
          <AnimatePresence>
            {nextLevel && progress > 80 && (
              <motion.p
                className="text-xs mt-2"
                style={{ color: PsychologyFlow.waters[nextLevel].colors.primary }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Approaching {PsychologyFlow.waters[nextLevel].name}...
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Flow visualization */}
                <div className="flex items-center justify-between">
                  {levels.map((level, index) => {
                    const isActive = level === currentLevel;
                    const isPast = index < currentIndex;
                    const levelFlow = PsychologyFlow.waters[level];
                    const LevelIcon = icons[level];
                    
                    return (
                      <React.Fragment key={level}>
                        <motion.button
                          className="relative"
                          onClick={() => onLevelChange?.(level)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{
                              background: isActive ? levelFlow.colors.primary : 
                                       isPast ? `${levelFlow.colors.primary}40` : 
                                       `${levelFlow.colors.primary}10`,
                              border: `2px solid ${levelFlow.colors.primary}`
                            }}
                            animate={isActive ? {
                              boxShadow: [
                                `0 0 0 0 ${levelFlow.colors.glow}`,
                                `0 0 0 10px transparent`,
                              ]
                            } : {}}
                            transition={{
                              duration: 2,
                              repeat: isActive ? Infinity : 0
                            }}
                          >
                            <LevelIcon 
                              className="w-6 h-6" 
                              style={{ 
                                color: isActive || isPast ? 'white' : levelFlow.colors.primary 
                              }} 
                            />
                          </motion.div>
                          <motion.p
                            className="text-xs mt-1 font-medium"
                            style={{ 
                              color: isActive ? levelFlow.colors.primary : 
                                     isPast ? `${levelFlow.colors.primary}80` : 
                                     '#9CA3AF'
                            }}
                          >
                            {levelFlow.name.split(' ')[0]}
                          </motion.p>
                        </motion.button>
                        
                        {index < levels.length - 1 && (
                          <motion.div
                            className="flex-1 h-0.5 mx-2"
                            style={{
                              background: isPast || (isActive && progress > 50) ? 
                                `linear-gradient(90deg, ${levelFlow.colors.primary} 0%, ${PsychologyFlow.waters[levels[index + 1]].colors.primary} 100%)` :
                                '#E5E7EB'
                            }}
                            animate={isActive && progress > 50 ? {
                              opacity: [0.5, 1, 0.5]
                            } : {}}
                            transition={{
                              duration: 2,
                              repeat: Infinity
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                
                {/* Characteristics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500">Rhythm</p>
                    <p className="font-medium" style={{ color: flow.colors.primary }}>
                      {flow.characteristics.rhythm}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500">Movement</p>
                    <p className="font-medium" style={{ color: flow.colors.primary }}>
                      {flow.characteristics.movement}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500">Depth</p>
                    <p className="font-medium" style={{ color: flow.colors.primary }}>
                      {flow.characteristics.depth}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500">Temperature</p>
                    <p className="font-medium" style={{ color: flow.colors.primary }}>
                      {flow.characteristics.temperature}
                    </p>
                  </div>
                </div>
                
                {/* Animation preview */}
                <div className="flex items-center justify-center py-2">
                  <motion.div
                    className="w-20 h-1 rounded-full"
                    style={{ background: flow.colors.primary }}
                    animate={{
                      scaleX: currentLevel === 'trust' ? [1, 1.2, 1] :
                              currentLevel === 'confidence' ? [1, 0.8, 1.2, 1] :
                              [0, 1, 0],
                      opacity: currentLevel === 'intelligence' ? [0, 1, 0] : 1
                    }}
                    transition={{
                      duration: flow.animation.timing.breath / 1000,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
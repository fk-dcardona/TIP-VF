'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface WaterFlowBackgroundProps {
  psychologyLevel: 'trust' | 'confidence' | 'intelligence';
  intensity?: number;
  children?: React.ReactNode;
}

export default function WaterFlowBackground({ 
  psychologyLevel, 
  intensity = 1,
  children 
}: WaterFlowBackgroundProps) {
  
  // Generate water flow particles based on psychology level
  const particles = useMemo(() => {
    const count = psychologyLevel === 'trust' ? 20 : 
                  psychologyLevel === 'confidence' ? 40 : 60;
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 5,
      duration: psychologyLevel === 'trust' ? 20 + Math.random() * 10 :
                psychologyLevel === 'confidence' ? 10 + Math.random() * 5 :
                5 + Math.random() * 3
    }));
  }, [psychologyLevel]);
  
  const flowConfig = {
    trust: {
      // Deep ocean currents - slow, powerful
      gradient: 'radial-gradient(ellipse at center, #060735 0%, #1e1b4b 50%, #000014 100%)',
      waveAmplitude: 50,
      waveFrequency: 0.5,
      flowSpeed: 0.3,
      particleColor: 'rgba(255, 255, 255, 0.03)',
      glowColor: 'rgba(6, 7, 53, 0.3)'
    },
    confidence: {
      // River current - steady, directional
      gradient: 'linear-gradient(135deg, #2128B1 0%, #3A40C9 50%, #1e1b4b 100%)',
      waveAmplitude: 30,
      waveFrequency: 1,
      flowSpeed: 0.6,
      particleColor: 'rgba(255, 255, 255, 0.05)',
      glowColor: 'rgba(33, 40, 177, 0.4)'
    },
    intelligence: {
      // Mountain stream - quick, sparkling
      gradient: 'linear-gradient(90deg, #3B82F6 0%, #2563eb 25%, #1d4ed8 50%, #2563eb 75%, #3B82F6 100%)',
      waveAmplitude: 20,
      waveFrequency: 2,
      flowSpeed: 1,
      particleColor: 'rgba(255, 255, 255, 0.1)',
      glowColor: 'rgba(59, 130, 246, 0.5)'
    }
  };
  
  const config = flowConfig[psychologyLevel];
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: config.gradient,
          opacity: 0.1 * intensity
        }}
        animate={{
          backgroundPosition: psychologyLevel === 'intelligence' ? ['0% 50%', '100% 50%'] : undefined,
        }}
        transition={psychologyLevel === 'intelligence' ? {
          duration: 10,
          repeat: Infinity,
          ease: 'linear'
        } : undefined}
      />
      
      {/* Flowing waves */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        style={{ opacity: 0.1 * intensity }}
      >
        <defs>
          <linearGradient id={`flow-gradient-${psychologyLevel}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={config.glowColor} stopOpacity="0" />
            <stop offset="50%" stopColor={config.glowColor} stopOpacity="1" />
            <stop offset="100%" stopColor={config.glowColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {[...Array(3)].map((_, i) => (
          <motion.path
            key={i}
            fill="none"
            stroke={`url(#flow-gradient-${psychologyLevel})`}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ 
              pathLength: 1,
              pathOffset: [0, -2]
            }}
            transition={{
              pathLength: { duration: 2, delay: i * 0.5 },
              pathOffset: {
                duration: 10 / config.flowSpeed,
                repeat: Infinity,
                ease: 'linear'
              }
            }}
            d={`M 0,${50 + i * 20} Q ${25},${50 + i * 20 + Math.sin(i) * config.waveAmplitude} 50,${50 + i * 20} T 100,${50 + i * 20}`}
          />
        ))}
      </svg>
      
      {/* Water particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              background: config.particleColor,
              boxShadow: `0 0 ${particle.size * 2}px ${config.glowColor}`
            }}
            animate={{
              x: psychologyLevel === 'trust' ? 
                [0, Math.sin(particle.id) * config.waveAmplitude, 0] :
                psychologyLevel === 'confidence' ?
                [0, 100] :
                [0, Math.random() * 200 - 100],
              y: psychologyLevel === 'trust' ?
                [-particle.y, -particle.y - 100] :
                psychologyLevel === 'confidence' ?
                [0, Math.sin(particle.id * 0.1) * config.waveAmplitude] :
                [-particle.y, -particle.y - 200],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: psychologyLevel === 'trust' ? 'easeInOut' : 'linear'
            }}
          />
        ))}
      </div>
      
      {/* Depth layers for trust */}
      {psychologyLevel === 'trust' && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`depth-${i}`}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 100%, ${config.glowColor} 0%, transparent 70%)`,
                opacity: (0.1 - i * 0.03) * intensity
              }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          ))}
        </>
      )}
      
      {/* Current lines for confidence */}
      {psychologyLevel === 'confidence' && (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.2 * intensity }}>
          {[...Array(5)].map((_, i) => (
            <motion.line
              key={`current-${i}`}
              x1="0"
              y1={`${20 + i * 20}%`}
              x2="100%"
              y2={`${20 + i * 20}%`}
              stroke={config.glowColor}
              strokeWidth="1"
              strokeDasharray="10 5"
              animate={{
                x1: [-10, 110],
                x2: [-10, 110]
              }}
              transition={{
                duration: 5 / config.flowSpeed,
                delay: i * 0.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ))}
        </svg>
      )}
      
      {/* Sparkles for intelligence */}
      {psychologyLevel === 'intelligence' && (
        <>
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180]
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 5,
                repeat: Infinity
              }}
            >
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 bg-white rounded-full blur-sm" />
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse" />
              </div>
            </motion.div>
          ))}
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
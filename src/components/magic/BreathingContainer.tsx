'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PsychologyFlow } from '@/design-system/psychology-flow';

interface BreathingContainerProps {
  psychologyLevel: 'trust' | 'confidence' | 'intelligence';
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  responsive?: boolean;
}

export default function BreathingContainer({
  psychologyLevel,
  children,
  className = '',
  intensity = 1,
  responsive = true
}: BreathingContainerProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  
  const flow = PsychologyFlow.waters[psychologyLevel];
  
  // Natural breathing cycle
  useEffect(() => {
    let animationFrame: number;
    const startTime = Date.now();
    
    const breathe = () => {
      const elapsed = Date.now() - startTime;
      const phase = (elapsed / flow.animation.timing.breath) * 2 * Math.PI;
      
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
  }, [flow.animation.timing.breath]);
  
  // Track mouse for responsive breathing
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!responsive) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };
  
  // Calculate breathing parameters
  const breathingScale = 1 + (breathPhase * 0.02 * intensity);
  const breathingOpacity = 0.95 + (breathPhase * 0.05 * intensity);
  const breathingBlur = psychologyLevel === 'trust' ? breathPhase * 0.5 : 0;
  
  // Mouse influence on breathing
  const mouseInfluence = isHovered && responsive ? {
    x: (mousePosition.x - 0.5) * 10,
    y: (mousePosition.y - 0.5) * 10
  } : { x: 0, y: 0 };
  
  return (
    <motion.div
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      animate={{
        scale: breathingScale,
        opacity: breathingOpacity,
      }}
      transition={{
        scale: { duration: 0.1, ease: 'linear' },
        opacity: { duration: 0.2, ease: 'linear' }
      }}
    >
      {/* Breathing glow aura */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, 
            ${flow.colors.glow} 0%, 
            transparent 60%)`,
          filter: `blur(${20 + breathingBlur}px)`,
          transform: 'translateZ(-10px)',
        }}
        animate={{
          scale: 1.1 + breathPhase * 0.1,
          opacity: (0.3 + breathPhase * 0.2) * intensity
        }}
      />
      
      {/* Psychology-specific effects */}
      {psychologyLevel === 'trust' && (
        <>
          {/* Deep ocean shadows */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${flow.colors.primary}20 100%)`,
              transform: 'translateZ(-5px)',
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: flow.animation.timing.breath / 1000,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Depth particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                background: flow.colors.glow,
              }}
              animate={{
                y: [0, -20 + breathPhase * 10, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: flow.animation.timing.breath / 1000,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </>
      )}
      
      {psychologyLevel === 'confidence' && (
        <>
          {/* Pulse rings */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2"
              style={{
                borderColor: flow.colors.primary,
                transform: 'translateZ(-2px)',
              }}
              initial={{ scale: 1, opacity: 0 }}
              animate={{
                scale: [1, 1.1, 1.2],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          )}
          
          {/* Energy lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
            <motion.path
              d={`M 0,50 Q ${mousePosition.x * 100},${mousePosition.y * 100} 100,50`}
              fill="none"
              stroke={flow.colors.primary}
              strokeWidth="1"
              animate={{
                pathLength: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </svg>
        </>
      )}
      
      {psychologyLevel === 'intelligence' && (
        <>
          {/* Data streams */}
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-xl"
            style={{ opacity: 0.1 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-px w-full"
                style={{
                  top: `${30 + i * 20}%`,
                  background: `linear-gradient(90deg, transparent 0%, ${flow.colors.primary} 50%, transparent 100%)`,
                }}
                animate={{
                  x: [-200, 200],
                }}
                transition={{
                  duration: 3 - i * 0.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </motion.div>
          
          {/* Spark on hover */}
          {isHovered && (
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: `${mousePosition.x * 100}%`,
                top: `${mousePosition.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-0.5 h-4 bg-blue-400"
                    style={{
                      left: '50%',
                      top: '50%',
                      transformOrigin: 'center bottom',
                    }}
                    animate={{
                      rotate: i * 60,
                      scaleY: [0, 1, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
      
      {/* Main content with 3D transform */}
      <motion.div
        className="relative z-10"
        style={{
          transform: `translateZ(0) rotateX(${mouseInfluence.y * 0.5}deg) rotateY(${mouseInfluence.x * 0.5}deg)`,
          transformStyle: 'preserve-3d',
        }}
        transition={{
          transform: { duration: 0.2, ease: 'easeOut' }
        }}
      >
        {children}
      </motion.div>
      
      {/* Breathing indicator */}
      <motion.div
        className="absolute bottom-2 right-2 w-2 h-2 rounded-full"
        style={{
          background: flow.colors.primary,
          opacity: 0.3,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: flow.animation.timing.breath / 1000,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
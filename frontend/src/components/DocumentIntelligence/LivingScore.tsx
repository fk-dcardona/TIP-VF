'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useBreathing } from '@/hooks/useBreathing';

interface LivingScoreProps {
  score: number;
  label: string;
  color?: string;
  delay?: number;
}

export default function LivingScore({ score, label, color = '#0066CC', delay = 0 }: LivingScoreProps) {
  const [isVisible, setIsVisible] = useState(false);
  const breathing = useBreathing();
  const controls = useAnimation();
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 100);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible) {
      controls.start({
        scale: [0, 1.1, 1],
        opacity: [0, 1],
        transition: {
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94], // Natural easing
        }
      });
    }
  }, [isVisible, controls]);

  // Calculate ripple intensity based on score
  const rippleIntensity = score / 100;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="relative flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay * 0.1 }}
        >
          {/* Organic background pulse */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            }}
            animate={{
              scale: breathing.scale * (1 + rippleIntensity * 0.2),
              opacity: breathing.opacity * 0.3,
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Water ripple effect */}
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.5, 2],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: delay * 0.2,
              ease: "easeOut",
            }}
          >
            <div 
              className="w-full h-full rounded-full"
              style={{
                border: `2px solid ${color}`,
                opacity: 0.3,
              }}
            />
          </motion.div>

          {/* Main score circle */}
          <motion.div
            className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(${color} ${score * 3.6}deg, #e0e0e0 0deg)`,
            }}
            animate={controls}
            whileHover={{
              scale: 1.05,
              transition: { type: "spring", stiffness: 300 }
            }}
          >
            <motion.div
              className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(0,0,0,0.1)",
                  `0 0 30px ${color}40`,
                  "0 0 20px rgba(0,0,0,0.1)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <motion.span
                className="text-2xl font-bold"
                style={{ color }}
                animate={{
                  scale: breathing.scale,
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {score}
              </motion.span>
              <span className="text-xs text-gray-500">{label}</span>
            </motion.div>
          </motion.div>

          {/* Organic particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ background: color }}
              initial={{ opacity: 0 }}
              animate={{
                y: [-20, -40 - i * 10],
                x: [0, (i - 1) * 15],
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: delay * 0.1 + i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
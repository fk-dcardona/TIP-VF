'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, FileText, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { useBreathing } from '@/hooks/useBreathing';

interface MetricData {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ComponentType<any>;
}

interface GrowingMetricsProps {
  metrics: MetricData[];
  onMetricHover?: (metric: MetricData | null) => void;
}

export default function GrowingMetrics({ metrics, onMetricHover }: GrowingMetricsProps) {
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>([]);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const breathing = useBreathing(3000);

  useEffect(() => {
    // Staggered reveal like plants growing
    metrics.forEach((metric, index) => {
      setTimeout(() => {
        setVisibleMetrics(prev => [...prev, metric.id]);
      }, index * 400 + 200);
    });
  }, [metrics]);

  const handleMetricHover = (metric: MetricData | null) => {
    setHoveredMetric(metric?.id || null);
    onMetricHover?.(metric);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <AnimatePresence key={metric.id}>
          {visibleMetrics.includes(metric.id) && (
            <motion.div
              className="relative group cursor-pointer"
              initial={{ 
                y: 50, 
                opacity: 0, 
                scale: 0.8,
                rotateX: -20 
              }}
              animate={{ 
                y: 0, 
                opacity: 1, 
                scale: 1,
                rotateX: 0 
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: index * 0.1,
              }}
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { 
                  type: "spring", 
                  stiffness: 300,
                  damping: 20 
                }
              }}
              onHoverStart={() => handleMetricHover(metric)}
              onHoverEnd={() => handleMetricHover(null)}
            >
              {/* Organic growth background */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-30"
                style={{
                  background: `radial-gradient(circle at 30% 70%, ${metric.color}20 0%, transparent 60%)`,
                }}
                animate={{
                  scale: breathing.scale,
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              />

              {/* Root system effect */}
              <motion.div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                initial={{ height: 0 }}
                animate={{ height: hoveredMetric === metric.id ? 20 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-px bg-gradient-to-t from-gray-300 to-transparent"
                    style={{
                      left: `${(i - 2) * 4}px`,
                      height: `${10 + i * 2}px`,
                      opacity: 0.6,
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ 
                      scaleY: hoveredMetric === metric.id ? 1 : 0,
                      x: Math.sin(i) * 3,
                    }}
                    transition={{ 
                      duration: 0.8, 
                      delay: i * 0.1,
                      ease: "easeOut" 
                    }}
                  />
                ))}
              </motion.div>

              {/* Main card */}
              <motion.div
                className="relative z-10 bg-white rounded-xl p-6 border border-gray-100 shadow-sm overflow-hidden"
                style={{
                  borderColor: hoveredMetric === metric.id ? metric.color : undefined,
                }}
                animate={{
                  borderColor: hoveredMetric === metric.id ? metric.color : '#f3f4f6',
                  boxShadow: hoveredMetric === metric.id 
                    ? `0 10px 25px -5px ${metric.color}20`
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Flowing background pattern */}
                <motion.div
                  className="absolute inset-0 opacity-5"
                  style={{
                    background: `linear-gradient(135deg, ${metric.color} 0%, transparent 50%)`,
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />

                {/* Icon with organic motion */}
                <motion.div
                  className="flex items-center justify-between mb-4"
                  animate={{
                    x: breathing.rotate * 0.5,
                  }}
                >
                  <motion.div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${metric.color}15` }}
                    animate={{
                      rotate: [0, 2, -2, 0],
                      scale: breathing.scale,
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  >
                    <metric.icon 
                      className="w-6 h-6"
                      style={{ color: metric.color }}
                    />
                  </motion.div>

                  {/* Trend indicator with natural motion */}
                  <motion.div
                    className="flex items-center"
                    animate={{
                      y: metric.trend === 'up' ? [-1, 1, -1] : 
                         metric.trend === 'down' ? [1, -1, 1] : 0,
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  >
                    {metric.trend === 'up' && (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    )}
                    {metric.trend === 'down' && (
                      <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
                    )}
                    {metric.trend === 'stable' && (
                      <Activity className="w-4 h-4 text-gray-500" />
                    )}
                  </motion.div>
                </motion.div>

                {/* Value with organic growth */}
                <motion.div
                  className="mb-2"
                  animate={{
                    scale: hoveredMetric === metric.id ? 1.05 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.span
                    className="text-3xl font-bold"
                    style={{ color: metric.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: index * 0.1 + 0.3,
                    }}
                  >
                    {metric.value}
                  </motion.span>
                  <span className="text-lg text-gray-600 ml-1">
                    {metric.unit}
                  </span>
                </motion.div>

                <motion.p
                  className="text-sm text-gray-600 font-medium"
                  animate={{
                    opacity: breathing.opacity,
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {metric.label}
                </motion.p>

                {/* Growth particles */}
                <AnimatePresence>
                  {hoveredMetric === metric.id && (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 rounded-full"
                          style={{ 
                            backgroundColor: metric.color,
                            left: `${20 + i * 10}%`,
                            top: `${30 + (i % 2) * 20}%`,
                          }}
                          initial={{ 
                            scale: 0, 
                            opacity: 0,
                            y: 10 
                          }}
                          animate={{ 
                            scale: [0, 1.5, 0],
                            opacity: [0, 0.8, 0],
                            y: [10, -20],
                            x: [0, Math.sin(i) * 10],
                          }}
                          exit={{ 
                            scale: 0, 
                            opacity: 0 
                          }}
                          transition={{
                            duration: 2,
                            delay: i * 0.1,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>

                {/* Ripple effect on hover */}
                <AnimatePresence>
                  {hoveredMetric === metric.id && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        border: `2px solid ${metric.color}`,
                        borderOpacity: 0.3,
                      }}
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ 
                        scale: [1, 1.1, 1.2],
                        opacity: [0.8, 0.4, 0],
                      }}
                      exit={{ scale: 1, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      ))}
    </div>
  );
}
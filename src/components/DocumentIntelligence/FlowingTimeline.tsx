'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

interface TimelineStep {
  id: string;
  label: string;
  count: number;
  status: 'active' | 'completed' | 'pending';
  icon: React.ComponentType<any>;
}

interface FlowingTimelineProps {
  steps: TimelineStep[];
}

export default function FlowingTimeline({ steps }: FlowingTimelineProps) {
  const [flowProgress, setFlowProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlowProgress(prev => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full p-6 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-xl overflow-hidden">
      {/* Flowing background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            #0066CC 20%, 
            #00AA44 40%, 
            #0066CC 60%, 
            transparent 80%
          )`,
        }}
        animate={{
          x: [`-100%`, `100%`],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="mr-2"
        >
          <Zap className="w-5 h-5 text-blue-600" />
        </motion.div>
        Today's Document Flow
      </h3>

      <div className="flex items-center justify-between space-x-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Container */}
            <motion.div
              className="flex-1 relative"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              {/* Organic growth container */}
              <motion.div
                className="relative"
                whileHover={{ 
                  scale: 1.05,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                {/* Breathing aura */}
                <motion.div
                  className="absolute inset-0 rounded-lg -m-2"
                  style={{
                    background: step.status === 'active' 
                      ? 'radial-gradient(circle, rgba(0,102,204,0.2) 0%, transparent 70%)'
                      : step.status === 'completed'
                      ? 'radial-gradient(circle, rgba(0,170,68,0.2) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(102,102,102,0.1) 0%, transparent 70%)',
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />

                {/* Main step box */}
                <motion.div
                  className={`
                    relative z-10 bg-white rounded-lg p-4 border-2 text-center
                    ${step.status === 'active' ? 'border-blue-400 shadow-lg' : ''}
                    ${step.status === 'completed' ? 'border-green-400 shadow-md' : ''}
                    ${step.status === 'pending' ? 'border-gray-200' : ''}
                  `}
                  animate={{
                    y: step.status === 'active' ? [0, -2, 0] : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                >
                  {/* Icon with organic motion */}
                  <motion.div
                    className="flex justify-center mb-2"
                    animate={{
                      rotate: step.status === 'active' ? [0, 5, -5, 0] : 0,
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  >
                    <step.icon 
                      className={`w-6 h-6 ${
                        step.status === 'active' ? 'text-blue-600' :
                        step.status === 'completed' ? 'text-green-600' :
                        'text-gray-400'
                      }`}
                    />
                  </motion.div>

                  {/* Count with growing animation */}
                  <motion.div
                    className={`text-2xl font-bold mb-1 ${
                      step.status === 'active' ? 'text-blue-800' :
                      step.status === 'completed' ? 'text-green-800' :
                      'text-gray-600'
                    }`}
                    animate={{
                      scale: step.status === 'active' ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.1,
                    }}
                  >
                    {step.count}
                  </motion.div>

                  <div className="text-xs text-gray-600 font-medium">
                    {step.label}
                  </div>

                  {/* Status indicator */}
                  <motion.div
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      step.status === 'active' ? 'bg-blue-500' :
                      step.status === 'completed' ? 'bg-green-500' :
                      'bg-gray-300'
                    }`}
                    animate={{
                      scale: step.status === 'active' ? [1, 1.3, 1] : 1,
                      opacity: step.status === 'active' ? [1, 0.7, 1] : 0.8,
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Flow connector */}
            {index < steps.length - 1 && (
              <motion.div
                className="flex-none relative w-8 h-1"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: (index + 1) * 0.2, duration: 0.8 }}
              >
                {/* Water flow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* Flow particles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-500 rounded-full"
                    style={{
                      top: '50%',
                      left: 0,
                    }}
                    animate={{
                      x: [0, 32],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.5 + i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Arrow indicator */}
                <motion.div
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1"
                  animate={{
                    x: [0, 3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                >
                  <div className="w-0 h-0 border-l-2 border-l-blue-400 border-t-1 border-b-1 border-t-transparent border-b-transparent" />
                </motion.div>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress wave at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-green-400"
        style={{
          width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`,
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
    </div>
  );
}
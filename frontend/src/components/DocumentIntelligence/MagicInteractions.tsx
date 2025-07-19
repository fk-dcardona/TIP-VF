'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MagicInteractionsProps {
  children: React.ReactNode;
  className?: string;
}

export function MagicHover({ children, className = '' }: MagicInteractionsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["2deg", "-2deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-2deg", "2deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: 1.02,
        transition: { type: "spring", stiffness: 300 }
      }}
    >
      {children}
    </motion.div>
  );
}

interface FloatingElementsProps {
  count?: number;
  color?: string;
}

export function FloatingElements({ count = 20, color = '#0066CC' }: FloatingElementsProps) {
  const [elements, setElements] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    const newElements = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
    }));
    setElements(newElements);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full opacity-30"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: element.size,
            height: element.size,
            backgroundColor: color,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.sin(element.id) * 10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface WaveBackgroundProps {
  color1?: string;
  color2?: string;
}

export function WaveBackground({ color1 = '#0066CC', color2 = '#00AA44' }: WaveBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary wave */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(45deg, ${color1}10, transparent, ${color2}10)`,
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      
      {/* Secondary wave */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 20% 70%, ${color1}15 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, ${color2}15 0%, transparent 50%)`,
        }}
        animate={{
          transform: ['scale(1) rotate(0deg)', 'scale(1.1) rotate(180deg)', 'scale(1) rotate(360deg)'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

interface MorphingShapeProps {
  size?: number;
  color?: string;
  morphSpeed?: number;
}

export function MorphingShape({ size = 100, color = '#0066CC', morphSpeed = 3 }: MorphingShapeProps) {
  const pathVariants = {
    shape1: {
      d: "M50,10 Q90,50 50,90 Q10,50 50,10 Z",
    },
    shape2: {
      d: "M30,20 Q70,20 70,50 Q70,80 30,80 Q10,50 30,20 Z",
    },
    shape3: {
      d: "M50,5 Q85,25 85,50 Q85,75 50,95 Q15,75 15,50 Q15,25 50,5 Z",
    },
    shape4: {
      d: "M40,15 Q80,30 75,60 Q60,85 40,85 Q20,85 5,60 Q0,30 40,15 Z",
    },
  };

  const shapes = Object.keys(pathVariants);
  const [currentShape, setCurrentShape] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShape((prev) => (prev + 1) % shapes.length);
    }, morphSpeed * 1000);

    return () => clearInterval(interval);
  }, [shapes.length, morphSpeed]);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="absolute"
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: morphSpeed * shapes.length,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <motion.path
        fill={color}
        fillOpacity={0.1}
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.3}
        animate={pathVariants[shapes[currentShape] as keyof typeof pathVariants]}
        transition={{
          duration: morphSpeed,
          ease: "easeInOut",
        }}
      />
    </motion.svg>
  );
}

interface BreathingContainerProps {
  children: React.ReactNode;
  intensity?: number;
  rate?: number;
}

export function BreathingContainer({ children, intensity = 0.02, rate = 4000 }: BreathingContainerProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1 + intensity, 1],
        opacity: [0.95, 1, 0.95],
      }}
      transition={{
        duration: rate / 1000,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

interface RippleEffectProps {
  trigger: boolean;
  color?: string;
  onComplete?: () => void;
}

export function RippleEffect({ trigger, color = '#0066CC', onComplete }: RippleEffectProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {trigger && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `2px solid ${color}`,
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: [0, 1.5, 2.5], opacity: [0.8, 0.4, 0] }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
        />
      )}
    </AnimatePresence>
  );
}

interface ParticleTrailProps {
  isActive: boolean;
  color?: string;
  particleCount?: number;
}

export function ParticleTrail({ isActive, color = '#0066CC', particleCount = 8 }: ParticleTrailProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (isActive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: particleCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: color,
                left: mousePos.x,
                top: mousePos.y,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0],
                x: [0, (Math.random() - 0.5) * 100],
                y: [0, (Math.random() - 0.5) * 100],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
import { useState, useEffect, useCallback } from 'react';

interface BreathingConfig {
  duration: number; // in seconds
  ease: string;
  delay: number;
}

interface BreathingState {
  scale: number;
  opacity: number;
  rotation: number;
}

export function useBreathing(config: Partial<BreathingConfig> = {}) {
  const {
    duration = 4,
    ease = 'easeInOut',
    delay = 0
  } = config;

  const [state, setState] = useState<BreathingState>({
    scale: 1,
    opacity: 1,
    rotation: 0
  });

  const [isActive, setIsActive] = useState(true);

  const animate = useCallback(() => {
    if (!isActive) return;

    const startTime = Date.now();
    const cycleDuration = duration * 1000; // Convert to milliseconds

    const updateAnimation = () => {
      if (!isActive) return;

      const elapsed = Date.now() - startTime;
      const progress = (elapsed % cycleDuration) / cycleDuration;

      // Create a smooth breathing cycle using sine wave
      const breathingProgress = Math.sin(progress * Math.PI * 2);
      
      // Scale varies between 0.95 and 1.05
      const scale = 1 + (breathingProgress * 0.05);
      
      // Opacity varies slightly for subtle effect
      const opacity = 0.95 + (breathingProgress * 0.05);
      
      // Rotation for organic movement
      const rotation = breathingProgress * 2;

      setState({ scale, opacity, rotation });

      requestAnimationFrame(updateAnimation);
    };

    requestAnimationFrame(updateAnimation);
  }, [duration, isActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      animate();
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [animate, delay]);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const resume = useCallback(() => {
    setIsActive(true);
  }, []);

  const reset = useCallback(() => {
    setState({ scale: 1, opacity: 1, rotation: 0 });
  }, []);

  return {
    ...state,
    isActive,
    pause,
    resume,
    reset
  };
}

// Specialized breathing hooks for different components
export function useLivingScore(config: Partial<BreathingConfig> = {}) {
  return useBreathing({ duration: 3, ...config });
}

export function useGrowingMetrics(config: Partial<BreathingConfig> = {}) {
  return useBreathing({ duration: 5, ...config });
}

export function useFlowingTimeline(config: Partial<BreathingConfig> = {}) {
  return useBreathing({ duration: 6, ...config });
}

export function useOrganicDashboard(config: Partial<BreathingConfig> = {}) {
  return useBreathing({ duration: 4, ...config });
} 
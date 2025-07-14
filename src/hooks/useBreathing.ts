import { useEffect, useState } from 'react';

interface BreathingState {
  scale: number;
  opacity: number;
  rotate: number;
}

export function useBreathing(rate: number = 4000): BreathingState {
  const [breathing, setBreathing] = useState<BreathingState>({
    scale: 1,
    opacity: 1,
    rotate: 0,
  });

  useEffect(() => {
    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const phase = (elapsed / rate) * 2 * Math.PI;
      
      // Natural breathing curve - inhale slower than exhale
      const breatheCurve = Math.sin(phase);
      const naturalCurve = breatheCurve > 0 
        ? Math.pow(breatheCurve, 0.7) // Slower inhale
        : -Math.pow(-breatheCurve, 1.3); // Faster exhale
      
      setBreathing({
        scale: 1 + naturalCurve * 0.05, // Subtle scale change
        opacity: 0.8 + naturalCurve * 0.2, // Gentle opacity pulse
        rotate: naturalCurve * 2, // Slight rotation for organic feel
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [rate]);

  return breathing;
}
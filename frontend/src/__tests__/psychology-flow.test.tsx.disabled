import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PsychologyDashboard from '@/components/psychology/PsychologyDashboard';
import KPIEvolutionCard from '@/components/psychology/KPIEvolutionCard';
import { PsychologyFlow } from '@/design-system/psychology-flow';
import { FileText } from 'lucide-react';

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'test-user' }),
  useOrganization: () => ({ 
    organization: { id: 'test-org', name: 'Test Organization' } 
  })
}));

// Test utilities for measuring psychological states
const measurePsychologicalState = (container: HTMLElement) => {
  const animations = container.querySelectorAll('[data-animation]');
  const colors = Array.from(container.querySelectorAll('*'))
    .map(el => window.getComputedStyle(el).backgroundColor)
    .filter(c => c !== 'rgba(0, 0, 0, 0)');
  
  const breathingElements = container.querySelectorAll('[style*="scale"]');
  const averageAnimationDuration = Array.from(animations)
    .map(el => parseFloat(window.getComputedStyle(el).animationDuration))
    .reduce((a, b) => a + b, 0) / (animations.length || 1);
  
  return {
    animationSpeed: averageAnimationDuration,
    colorTemperature: analyzeColorTemperature(colors),
    breathingDepth: breathingElements.length,
    interactionResponsiveness: measureResponsiveness(container)
  };
};

const analyzeColorTemperature = (colors: string[]) => {
  // Analyze if colors are "cool" (trust), "warm" (confidence), or "bright" (intelligence)
  const rgbValues = colors.map(c => {
    const match = c.match(/\d+/g);
    return match ? { r: +match[0], g: +match[1], b: +match[2] } : null;
  }).filter(Boolean);
  
  const avgBlue = rgbValues.reduce((sum, c) => sum + (c?.b || 0), 0) / rgbValues.length;
  const avgRed = rgbValues.reduce((sum, c) => sum + (c?.r || 0), 0) / rgbValues.length;
  
  if (avgBlue > avgRed * 1.5) return 'cool'; // Trust
  if (avgBlue > avgRed) return 'warm'; // Confidence  
  return 'bright'; // Intelligence
};

const measureResponsiveness = (container: HTMLElement) => {
  const buttons = container.querySelectorAll('button');
  const transitions = Array.from(buttons)
    .map(btn => window.getComputedStyle(btn).transition)
    .filter(t => t !== 'none');
  
  return transitions.length / (buttons.length || 1);
};

describe('Psychology-Driven User Experience', () => {
  
  // TEST SUITE 1: Trust Level Experience
  describe('Trust Psychology - Deep Ocean', () => {
    test('interface breathes slowly to establish presence', async () => {
      const { container } = render(
        <KPIEvolutionCard
          title="Total Revenue"
          value="$1.2M"
          icon={FileText}
          startingStage="trust"
        />
      );
      
      const card = container.querySelector('[class*="rounded-xl"]');
      expect(card).toBeTruthy();
      
      // Measure breathing rhythm
      const styles = window.getComputedStyle(card!);
      const animationDuration = styles.animationDuration || styles.transition;
      
      // Trust breathing should be around 6 seconds
      expect(animationDuration).toContain('6');
      
      // Color should be deep ocean
      expect(styles.borderColor).toContain('6, 7, 53'); // RGB for #060735
    });
    
    test('information reveals itself patiently', async () => {
      const { container } = render(
        <KPIEvolutionCard
          title="Documents"
          value="1,247"
          icon={FileText}
          trend={{ value: 23, direction: 'up', label: 'increase' }}
          startingStage="trust"
        />
      );
      
      // Initially, only the value should be visible
      expect(screen.getByText('1,247')).toBeInTheDocument();
      expect(screen.queryByText(/increase/)).not.toBeInTheDocument();
      
      // After patience (hover for 3+ seconds), trend reveals
      const card = container.querySelector('[class*="rounded-xl"]');
      fireEvent.mouseEnter(card!);
      
      // Wait for trust period
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 3500));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/increase/)).toBeInTheDocument();
      });
    });
    
    test('user feels unhurried and grounded', () => {
      const { container } = render(<PsychologyDashboard />);
      const state = measurePsychologicalState(container);
      
      expect(state.colorTemperature).toBe('cool');
      expect(state.animationSpeed).toBeGreaterThan(4); // Slow animations
      expect(state.breathingDepth).toBeGreaterThan(3); // Multiple breathing elements
      expect(state.interactionResponsiveness).toBeLessThan(0.5); // Deliberate interactions
    });
  });
  
  // TEST SUITE 2: Confidence Level Experience
  describe('Confidence Psychology - River Current', () => {
    test('interface pulses with purposeful rhythm', async () => {
      const { container } = render(
        <KPIEvolutionCard
          title="Cash Flow"
          value="$847K"
          icon={FileText}
          startingStage="confidence"
          trend={{ value: 12, direction: 'up', label: 'improvement' }}
        />
      );
      
      const card = container.querySelector('[class*="rounded-xl"]');
      const styles = window.getComputedStyle(card!);
      
      // Confidence pulsing should be around 3 seconds
      expect(styles.animationDuration || styles.transition).toContain('3');
      
      // Color should be confident blue
      expect(styles.borderColor).toContain('33, 40, 177'); // RGB for #2128B1
      
      // Trend should be immediately visible
      expect(screen.getByText(/improvement/)).toBeInTheDocument();
    });
    
    test('interactions feel responsive and encouraging', async () => {
      const onClick = jest.fn();
      const { container } = render(
        <KPIEvolutionCard
          title="Automation"
          value="92%"
          icon={FileText}
          startingStage="confidence"
          action={{ label: 'Optimize', onClick }}
        />
      );
      
      const card = container.querySelector('[class*="rounded-xl"]');
      
      // Hover should have immediate visual feedback
      fireEvent.mouseEnter(card!);
      
      // No delay needed for confidence level
      await waitFor(() => {
        const styles = window.getComputedStyle(card!);
        expect(styles.transform).toContain('scale');
      });
    });
    
    test('user feels empowered to make decisions', () => {
      const { container } = render(<PsychologyDashboard />);
      
      // Force confidence state
      act(() => {
        // Simulate time passing to reach confidence
        jest.advanceTimersByTime(15000);
      });
      
      const state = measurePsychologicalState(container);
      
      expect(state.colorTemperature).toBe('warm');
      expect(state.animationSpeed).toBeGreaterThan(2);
      expect(state.animationSpeed).toBeLessThan(4); // Medium speed
      expect(state.interactionResponsiveness).toBeGreaterThan(0.7); // Highly responsive
    });
  });
  
  // TEST SUITE 3: Intelligence Level Experience  
  describe('Intelligence Psychology - Mountain Stream', () => {
    test('interface sparkles with rapid insights', async () => {
      const { container } = render(
        <KPIEvolutionCard
          title="Supply Health"
          value="87%"
          icon={FileText}
          startingStage="intelligence"
          insight="3 suppliers need immediate attention"
          action={{ label: 'Review Now', onClick: jest.fn() }}
        />
      );
      
      // All information immediately visible
      expect(screen.getByText('87%')).toBeInTheDocument();
      expect(screen.getByText(/3 suppliers need/)).toBeInTheDocument();
      expect(screen.getByText('Review Now')).toBeInTheDocument();
      
      // Fast, crisp animations
      const card = container.querySelector('[class*="rounded-xl"]');
      const styles = window.getComputedStyle(card!);
      
      expect(styles.animationDuration || styles.transition).toContain('1.5');
      expect(styles.borderColor).toContain('59, 130, 246'); // RGB for #3B82F6
    });
    
    test('data flows like water through the interface', async () => {
      const { container } = render(<PsychologyDashboard />);
      
      // Force intelligence state
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      // Look for flowing elements
      const flowingElements = container.querySelectorAll('[style*="translateX"]');
      expect(flowingElements.length).toBeGreaterThan(0);
      
      // Check for data stream animations
      const animations = Array.from(container.querySelectorAll('*'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.animation.includes('flow') || style.transform.includes('translate');
        });
      
      expect(animations.length).toBeGreaterThan(5);
    });
    
    test('user achieves flow state with the interface', () => {
      const { container } = render(<PsychologyDashboard />);
      
      // Simulate rapid interactions
      const buttons = container.querySelectorAll('button');
      buttons.forEach(btn => {
        fireEvent.click(btn);
      });
      
      const state = measurePsychologicalState(container);
      
      expect(state.colorTemperature).toBe('bright');
      expect(state.animationSpeed).toBeLessThan(2); // Very fast
      expect(state.interactionResponsiveness).toBe(1); // Instant response
      expect(state.breathingDepth).toBeLessThan(2); // Minimal breathing, more flowing
    });
  });
  
  // TEST SUITE 4: Natural Progression Between Levels
  describe('Psychology Flow Transitions', () => {
    test('trust naturally evolves into confidence', async () => {
      const { container, rerender } = render(
        <KPIEvolutionCard
          title="Revenue"
          value="$2.3M"
          icon={FileText}
          startingStage="trust"
          evolutionSpeed="fast"
          trend={{ value: 15, direction: 'up', label: 'growth' }}
        />
      );
      
      const card = container.querySelector('[class*="rounded-xl"]');
      
      // Start in trust
      expect(window.getComputedStyle(card!).borderColor).toContain('6, 7, 53');
      
      // Hover to build engagement
      fireEvent.mouseEnter(card!);
      
      // Wait for evolution
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });
      
      // Should evolve to confidence
      await waitFor(() => {
        const newStyles = window.getComputedStyle(card!);
        expect(newStyles.borderColor).toContain('33, 40, 177');
      });
    });
    
    test('confidence flows into intelligence through interaction', async () => {
      const onClick = jest.fn();
      const { container } = render(
        <KPIEvolutionCard
          title="Efficiency"
          value="94%"
          icon={FileText}
          startingStage="confidence"
          evolutionSpeed="fast"
          action={{ label: 'Analyze', onClick }}
        />
      );
      
      const card = container.querySelector('[class*="rounded-xl"]');
      
      // Start in confidence
      expect(window.getComputedStyle(card!).borderColor).toContain('33, 40, 177');
      
      // Interact to trigger evolution
      fireEvent.click(card!);
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 3500));
      });
      
      // Should reach intelligence
      await waitFor(() => {
        expect(screen.getByText('Analyze')).toBeInTheDocument();
        const styles = window.getComputedStyle(card!);
        expect(styles.borderColor).toContain('59, 130, 246');
      });
    });
    
    test('complete cycle returns to deeper trust', async () => {
      const onClick = jest.fn();
      const { container } = render(
        <KPIEvolutionCard
          title="Success Rate"
          value="98%"
          icon={FileText}
          startingStage="intelligence"
          action={{ label: 'Complete', onClick }}
        />
      );
      
      // Take action at intelligence level
      const actionButton = screen.getByText('Complete');
      fireEvent.click(actionButton);
      
      // Should return to trust with "wisdom glow"
      await waitFor(() => {
        const card = container.querySelector('[class*="rounded-xl"]');
        expect(card).toHaveClass('trust-secured');
      });
    });
  });
  
  // TEST SUITE 5: Environmental Responsiveness
  describe('Living Organism Behavior', () => {
    test('interface adapts to time of day', () => {
      // Morning - bright and energetic
      const morning = new Date('2024-01-01T08:00:00');
      jest.setSystemTime(morning);
      
      const { container: morningContainer } = render(<PsychologyDashboard />);
      const morningState = measurePsychologicalState(morningContainer);
      
      // Evening - calmer and slower
      const evening = new Date('2024-01-01T20:00:00');
      jest.setSystemTime(evening);
      
      const { container: eveningContainer } = render(<PsychologyDashboard />);
      const eveningState = measurePsychologicalState(eveningContainer);
      
      // Morning should be more energetic
      expect(morningState.animationSpeed).toBeLessThan(eveningState.animationSpeed);
      expect(morningState.interactionResponsiveness).toBeGreaterThan(eveningState.interactionResponsiveness);
    });
    
    test('interface learns from user behavior', async () => {
      const { container } = render(<PsychologyDashboard />);
      
      // Simulate rapid user who wants speed
      const cards = container.querySelectorAll('[class*="Card"]');
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        cards.forEach(card => fireEvent.click(card));
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      // System should adapt to faster pace
      const postState = measurePsychologicalState(container);
      expect(postState.animationSpeed).toBeLessThan(3);
      expect(postState.interactionResponsiveness).toBeGreaterThan(0.8);
    });
    
    test('interface respects accessibility preferences', () => {
      // Mock reduced motion preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));
      
      const { container } = render(<PsychologyDashboard />);
      
      // Should have no animations but maintain psychology through color
      const animations = container.querySelectorAll('[style*="animation"]');
      expect(animations.length).toBe(0);
      
      // But colors should still indicate psychology level
      const state = measurePsychologicalState(container);
      expect(state.colorTemperature).toBeDefined();
    });
  });
  
  // TEST SUITE 6: Emergent Behaviors
  describe('Unexpected Emergent Properties', () => {
    test('users develop personal rhythms with the interface', async () => {
      const { container } = render(<PsychologyDashboard />);
      const clickTimes: number[] = [];
      
      // Track user interaction rhythm
      const trackRhythm = () => {
        clickTimes.push(Date.now());
      };
      
      // Simulate user developing a rhythm
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500 + Math.sin(i) * 200));
        });
        
        const buttons = container.querySelectorAll('button');
        if (buttons[i % buttons.length]) {
          fireEvent.click(buttons[i % buttons.length]);
          trackRhythm();
        }
      }
      
      // Analyze rhythm intervals
      const intervals = clickTimes.slice(1).map((time, i) => time - clickTimes[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
      
      // Users should develop consistent rhythm (low variance)
      expect(variance).toBeLessThan(50000); // Reasonably consistent
      expect(avgInterval).toBeGreaterThan(400); // Not too fast
      expect(avgInterval).toBeLessThan(800); // Not too slow
    });
    
    test('interface creates moments of delight', async () => {
      const { container } = render(<PsychologyDashboard />);
      const delightfulMoments: string[] = [];
      
      // Monitor for delightful interactions
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const element = mutation.target as HTMLElement;
            const style = element.getAttribute('style') || '';
            
            // Look for delightful animations
            if (style.includes('rotate') || style.includes('scale(1.1') || style.includes('sparkle')) {
              delightfulMoments.push(`Delight: ${element.className}`);
            }
          }
        });
      });
      
      observer.observe(container, { 
        attributes: true, 
        subtree: true, 
        attributeFilter: ['style'] 
      });
      
      // Interact with interface
      const cards = container.querySelectorAll('[class*="Card"]');
      for (const card of Array.from(cards).slice(0, 3)) {
        fireEvent.mouseEnter(card);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
        fireEvent.click(card);
      }
      
      // Should have created moments of delight
      expect(delightfulMoments.length).toBeGreaterThan(0);
      
      observer.disconnect();
    });
    
    test('interface feels alive even when idle', async () => {
      const { container } = render(<PsychologyDashboard />);
      
      // Let interface sit idle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
      });
      
      // Check for autonomous behaviors
      const breathingElements = container.querySelectorAll('[style*="scale"]');
      const flowingElements = container.querySelectorAll('[style*="translate"]');
      const pulsingElements = container.querySelectorAll('[style*="opacity"]');
      
      // Living interface should have autonomous animations
      expect(breathingElements.length + flowingElements.length + pulsingElements.length).toBeGreaterThan(5);
      
      // Measure "aliveness"
      const state = measurePsychologicalState(container);
      expect(state.breathingDepth).toBeGreaterThan(0);
    });
  });
});
// The Psychology Flow System - Like water finding its natural path
// Each level flows into the next, creating a living, breathing interface

export const PsychologyFlow = {
  // The Three Waters - Each psychology level has its own flow characteristics
  waters: {
    // TRUST: Deep Ocean - Slow, powerful, patient
    trust: {
      name: 'Deep Ocean',
      characteristics: {
        rhythm: 'tidal',        // 6-second breathing cycle
        movement: 'gradual',    // Changes happen slowly
        depth: 'profound',      // Information has weight
        temperature: 'cool'     // Calming presence
      },
      
      // Visual Properties
      colors: {
        primary: '#060735',     // Ocean depths
        secondary: '#1e1b4b',   // Twilight zone
        surface: '#f8fafc',     // Sea foam
        glow: 'rgba(6, 7, 53, 0.1)',
        
        // Natural progression
        gradient: {
          rest: 'linear-gradient(180deg, #060735 0%, #1e1b4b 100%)',
          active: 'linear-gradient(180deg, #1e1b4b 0%, #2128B1 100%)', // Flows to confidence
        }
      },
      
      typography: {
        scale: {
          hero: 'clamp(2.5rem, 5vw, 3.5rem)',    // Responsive monumentality
          body: 'clamp(1rem, 2vw, 1.125rem)',    // Readable at all sizes
        },
        weight: {
          hero: 900,      // Maximum weight for authority
          body: 400,      // Easy reading
        },
        spacing: {
          letters: '-0.03em',  // Tight for impact
          lines: 1.2,          // Compact for scanning
          blocks: '2rem'       // Generous breathing room
        }
      },
      
      animation: {
        timing: {
          breath: 6000,     // 6-second cycle
          transition: 800,  // Slow, deliberate
          delay: 200        // Thoughtful pause
        },
        easing: {
          primary: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // Slow start, slow end
          breath: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)' // Natural breathing
        },
        physics: {
          tension: 0.1,     // Low tension = slow movement
          friction: 0.8,    // High friction = controlled
          mass: 2.0         // Heavy = authoritative
        }
      }
    },
    
    // CONFIDENCE: River Current - Steady, directional, purposeful
    confidence: {
      name: 'River Current',
      characteristics: {
        rhythm: 'pulse',        // 3-second heartbeat
        movement: 'flowing',    // Constant forward motion
        depth: 'navigable',     // Clear path forward
        temperature: 'warm'     // Energizing presence
      },
      
      colors: {
        primary: '#2128B1',     // Finkargo signature
        secondary: '#3A40C9',   // Active state
        surface: '#f1f5f9',     // Working surface
        glow: 'rgba(33, 40, 177, 0.15)',
        
        gradient: {
          rest: 'linear-gradient(135deg, #2128B1 0%, #3A40C9 100%)',
          active: 'linear-gradient(135deg, #3A40C9 0%, #3B82F6 100%)', // Flows to intelligence
        }
      },
      
      typography: {
        scale: {
          hero: 'clamp(2rem, 4vw, 2.5rem)',      // Confident but not overwhelming
          body: 'clamp(0.95rem, 1.5vw, 1rem)',   // Optimal readability
        },
        weight: {
          hero: 700,      // Bold but not heavy
          body: 500,      // Slightly elevated
        },
        spacing: {
          letters: '-0.01em',  // Natural spacing
          lines: 1.5,          // Comfortable reading
          blocks: '1.5rem'     // Efficient use of space
        }
      },
      
      animation: {
        timing: {
          breath: 3000,     // 3-second pulse
          transition: 400,  // Responsive
          delay: 100        // Quick reaction
        },
        easing: {
          primary: 'cubic-bezier(0.4, 0.0, 0.6, 1)',  // Accelerate to action
          pulse: 'cubic-bezier(0.4, 0.0, 0.2, 1)'     // Heart rhythm
        },
        physics: {
          tension: 0.3,     // Medium tension = steady flow
          friction: 0.5,    // Balanced resistance
          mass: 1.0         // Normal weight
        }
      }
    },
    
    // INTELLIGENCE: Mountain Stream - Quick, clear, sparkling
    intelligence: {
      name: 'Mountain Stream',
      characteristics: {
        rhythm: 'sparkle',      // 1.5-second flashes
        movement: 'darting',    // Quick, precise
        depth: 'crystal',       // Perfect clarity
        temperature: 'crisp'    // Refreshing, alert
      },
      
      colors: {
        primary: '#3B82F6',     // Clear sky
        secondary: '#2563eb',   // Deep clarity
        surface: '#eff6ff',     // Morning mist
        glow: 'rgba(59, 130, 246, 0.2)',
        
        gradient: {
          rest: 'linear-gradient(90deg, #3B82F6 0%, #2563eb 100%)',
          active: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
          flow: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.4) 50%, transparent 100%)'
        }
      },
      
      typography: {
        scale: {
          hero: 'clamp(1.5rem, 3vw, 2rem)',      // Precise, not imposing
          body: 'clamp(0.875rem, 1vw, 0.95rem)', // Dense information
        },
        weight: {
          hero: 600,      // Clear but not heavy
          body: 400,      // Light for scanning
        },
        spacing: {
          letters: '0',        // Natural spacing
          lines: 1.6,          // Easy scanning
          blocks: '1rem'       // Compact efficiency
        }
      },
      
      animation: {
        timing: {
          breath: 1500,     // Quick sparkle
          transition: 200,  // Instant response
          delay: 0          // No hesitation
        },
        easing: {
          primary: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Natural snap
          sparkle: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' // Playful bounce
        },
        physics: {
          tension: 0.5,     // High tension = quick movement
          friction: 0.2,    // Low friction = free flowing
          mass: 0.5         // Light = agile
        }
      }
    }
  },
  
  // Natural Transitions - How one level flows into the next
  transitions: {
    // Trust → Confidence: Like dawn breaking over the ocean
    trustToConfidence: {
      trigger: 'sustained-attention', // 3+ seconds of focus
      duration: 1200,
      
      visual: {
        // Color shifts from deep ocean to river
        colorShift: {
          from: '#060735',
          through: '#141186',
          to: '#2128B1',
          gradient: 'linear-gradient(180deg, #060735 0%, #141186 50%, #2128B1 100%)'
        },
        
        // Scale increases slightly
        scaleShift: {
          from: 1.0,
          to: 1.02,
          curve: 'ease-out'
        },
        
        // Breathing quickens
        rhythmShift: {
          from: 6000,
          to: 3000,
          curve: 'ease-in-out'
        }
      },
      
      indicators: [
        'Shadows lighten and warm',
        'Edges become more defined',
        'Movement gains purpose',
        'Information reveals patterns'
      ]
    },
    
    // Confidence → Intelligence: Like river reaching rapids
    confidenceToIntelligence: {
      trigger: 'decisive-interaction', // Click, tap, or selection
      duration: 800,
      
      visual: {
        colorShift: {
          from: '#2128B1',
          through: '#2B52E0',
          to: '#3B82F6',
          gradient: 'linear-gradient(135deg, #2128B1 0%, #2B52E0 50%, #3B82F6 100%)'
        },
        
        clarityShift: {
          blur: [4, 2, 0],
          brightness: [1.0, 1.1, 1.2]
        },
        
        speedShift: {
          from: 3000,
          to: 1500,
          acceleration: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }
      },
      
      indicators: [
        'Data streams become visible',
        'Actions surface naturally',
        'Connections spark between elements',
        'Insights crystallize instantly'
      ]
    },
    
    // Intelligence → Trust: The cycle completes like rain returning to ocean
    intelligenceToTrust: {
      trigger: 'task-completion', // Action taken successfully
      duration: 2000,
      
      visual: {
        colorShift: {
          from: '#3B82F6',
          through: '#1e3a8a',
          to: '#060735',
          gradient: 'radial-gradient(circle, #3B82F6 0%, #1e3a8a 50%, #060735 100%)'
        },
        
        settlementAnimation: {
          particles: 'falling-drops',
          gravity: 0.8,
          spread: 'inward'
        },
        
        wisdomGlow: {
          color: 'gold',
          opacity: [0, 0.3, 0],
          duration: 3000
        }
      },
      
      indicators: [
        'Activity settles into calm',
        'New knowledge integrates',
        'System returns enriched',
        'Deeper trust established'
      ]
    }
  },
  
  // Interaction Patterns - How users navigate the flow
  interactions: {
    // Hover creates ripples in the current psychology level
    hover: {
      trust: {
        effect: 'deep-ripple',
        radius: 100,
        duration: 2000,
        opacity: 0.3
      },
      confidence: {
        effect: 'current-wake',
        radius: 60,
        duration: 1000,
        opacity: 0.5
      },
      intelligence: {
        effect: 'spark-scatter',
        radius: 40,
        duration: 500,
        opacity: 0.7
      }
    },
    
    // Clicks create waves that can change psychology levels
    click: {
      trust: {
        effect: 'depth-charge',
        canEvolve: true,
        evolutionThreshold: 0.7 // Strong clicks can push to confidence
      },
      confidence: {
        effect: 'splash-forward',
        canEvolve: true,
        evolutionThreshold: 0.5 // Medium clicks advance to intelligence
      },
      intelligence: {
        effect: 'crystal-shatter',
        canEvolve: true,
        evolutionThreshold: 0.3 // Light clicks complete the cycle
      }
    },
    
    // Scroll affects flow speed
    scroll: {
      trust: {
        effect: 'tide-shift',
        speedMultiplier: 0.5 // Slow scrolling in trust
      },
      confidence: {
        effect: 'current-boost',
        speedMultiplier: 1.0 // Natural scrolling
      },
      intelligence: {
        effect: 'rapid-scan',
        speedMultiplier: 1.5 // Fast scrolling for data
      }
    }
  },
  
  // Environmental Factors - The interface responds to context
  environment: {
    // Time of day affects the flow
    temporal: {
      morning: { brightness: 1.1, energy: 1.2 },   // Fresh, alert
      afternoon: { brightness: 1.0, energy: 1.0 }, // Balanced
      evening: { brightness: 0.9, energy: 0.8 },   // Calming
      night: { brightness: 0.8, energy: 0.6 }      // Restful
    },
    
    // User state affects responsiveness
    userState: {
      new: { guidance: 'high', evolution: 'slow' },
      returning: { guidance: 'medium', evolution: 'natural' },
      expert: { guidance: 'minimal', evolution: 'fast' }
    },
    
    // Device affects flow characteristics
    device: {
      mobile: { 
        touchTargets: 1.5,    // Larger for fingers
        animations: 0.7,      // Reduced for performance
        density: 0.8          // Less information
      },
      tablet: {
        touchTargets: 1.2,
        animations: 0.9,
        density: 0.9
      },
      desktop: {
        touchTargets: 1.0,
        animations: 1.0,
        density: 1.0
      }
    }
  }
};

// Helper function to get current flow state
export function getCurrentFlow(
  psychologyLevel: 'trust' | 'confidence' | 'intelligence',
  context?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    userType?: 'new' | 'returning' | 'expert';
    device?: 'mobile' | 'tablet' | 'desktop';
  }
) {
  const base = PsychologyFlow.waters[psychologyLevel];
  
  // Apply environmental modifiers
  if (context) {
    const temporal = context.timeOfDay ? 
      PsychologyFlow.environment.temporal[context.timeOfDay] : 
      { brightness: 1, energy: 1 };
    
    const device = context.device ?
      PsychologyFlow.environment.device[context.device] :
      { touchTargets: 1, animations: 1, density: 1 };
    
    // Return modified flow
    return {
      ...base,
      animation: {
        ...base.animation,
        timing: {
          breath: base.animation.timing.breath / temporal.energy,
          transition: base.animation.timing.transition * device.animations,
          delay: base.animation.timing.delay
        }
      },
      colors: {
        ...base.colors,
        // Adjust brightness based on time
        primary: adjustBrightness(base.colors.primary, temporal.brightness)
      }
    };
  }
  
  return base;
}

// Utility to adjust color brightness
function adjustBrightness(color: string, factor: number): string {
  // Simple brightness adjustment (would be more sophisticated in production)
  return color;
}

// Export types for TypeScript
export type PsychologyLevel = keyof typeof PsychologyFlow.waters;
export type FlowTransition = keyof typeof PsychologyFlow.transitions;
export type InteractionType = keyof typeof PsychologyFlow.interactions;
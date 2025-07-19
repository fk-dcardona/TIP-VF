// Vortex Creator Pattern: Ancient Wisdom + Modern Tech + Natural Systems
// This theme configuration combines color psychology, TypeScript patterns, and living interfaces

export const PsychologyTheme = {
  // TRUST FOUNDATION - Executive Level (Ancient: Authority Colors)
  trust: {
    // Ancient Wisdom: Navy represents authority, depth, and stability
    colors: {
      primary: '#060735',        // Deep ocean navy - maximum authority
      secondary: '#1e1b4b',      // Twilight navy - supporting depth
      accent: '#312e81',         // Royal purple - subtle power
      surface: '#f8fafc',        // Glacier white - clarity
      text: {
        primary: '#0f172a',      // Ink black - decisive communication
        secondary: '#334155',    // Steel gray - supporting information
        muted: '#64748b'         // Slate - de-emphasized content
      },
      background: {
        default: '#ffffff',      // Pure white - trust through transparency
        paper: '#f8fafc',        // Near white - subtle depth
        overlay: 'rgba(6, 7, 53, 0.08)' // Navy veil - gentle authority
      }
    },
    
    // Modern Tech: TypeScript-driven animation configs
    animations: {
      breath: {
        duration: 6000,          // 6s - matches deep breathing
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        scale: { min: 0.98, max: 1.02 },
        opacity: { min: 0.95, max: 1.0 }
      },
      transition: {
        slow: 400,               // Deliberate movements
        normal: 600,             // Standard transitions
        entrance: 800            // Grand entrances
      }
    },
    
    // Natural System: Ocean-inspired behaviors
    natural: {
      pattern: 'tidal',          // Slow, powerful waves
      depth: 'deep',             // Multi-layered information
      flow: 'circular',          // Return to center
      rhythm: {
        primary: 6000,           // Main breathing cycle
        secondary: 12000,        // Subtle background pulse
        micro: 400               // Quick acknowledgments
      }
    },
    
    // Typography for Authority
    typography: {
      hero: {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
        fontWeight: 900,
        letterSpacing: '-0.03em',
        textTransform: 'uppercase' as const,
        lineHeight: 1.1
      },
      title: {
        fontSize: 'clamp(1.875rem, 3vw, 2.25rem)',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1.2
      },
      body: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.6
      }
    }
  },
  
  // CONFIDENCE BUILDING - Financial Level (Ancient: Decision Colors)
  confidence: {
    // Ancient Wisdom: Blue represents trust, stability, and clear thinking
    colors: {
      primary: '#2128B1',        // Finkargo blue - confident action
      secondary: '#3A40C9',      // Vibrant purple - growth energy
      accent: '#4F46E5',         // Electric indigo - innovation
      surface: '#f1f5f9',        // Cloud white - thinking space
      text: {
        primary: '#1e293b',      // Charcoal - clear communication
        secondary: '#475569',    // Graphite - supporting data
        muted: '#94a3b8'         // Silver - background info
      },
      background: {
        default: '#ffffff',
        paper: '#f8fafc',
        overlay: 'rgba(33, 40, 177, 0.06)'
      }
    },
    
    // Modern Tech: Balanced animation system
    animations: {
      pulse: {
        duration: 3000,          // 3s - active heartbeat
        easing: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
        scale: { min: 1.0, max: 1.05 },
        opacity: { min: 0.9, max: 1.0 }
      },
      transition: {
        fast: 200,               // Quick responses
        normal: 300,             // Balanced movements
        smooth: 500              // Flowing transitions
      }
    },
    
    // Natural System: River-inspired behaviors
    natural: {
      pattern: 'flowing',        // Constant forward movement
      depth: 'moderate',         // Clear layers
      flow: 'directional',       // Purpose-driven
      rhythm: {
        primary: 3000,           // Active pulse
        secondary: 6000,         // Background flow
        micro: 300               // Quick feedback
      }
    },
    
    typography: {
      hero: {
        fontSize: 'clamp(2rem, 4vw, 2.5rem)',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        lineHeight: 1.3
      },
      title: {
        fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)',
        fontWeight: 600,
        lineHeight: 1.4
      },
      body: {
        fontSize: '0.9375rem',
        fontWeight: 400,
        lineHeight: 1.6
      }
    }
  },
  
  // INTELLIGENCE ACTIVE - Operational Level (Ancient: Clarity Colors)
  intelligence: {
    // Ancient Wisdom: Bright blue represents clarity, speed, and insight
    colors: {
      primary: '#3B82F6',        // Sky blue - mental clarity
      secondary: '#2563eb',      // Sapphire - deep insight
      accent: '#1d4ed8',         // Cobalt - focused action
      surface: '#eff6ff',        // Air white - lightness
      text: {
        primary: '#1e3a8a',      // Navy ink - precise communication
        secondary: '#3730a3',    // Indigo - analytical data
        muted: '#6366f1'         // Lavender - subtle hints
      },
      background: {
        default: '#ffffff',
        paper: '#f0f9ff',
        overlay: 'rgba(59, 130, 246, 0.05)'
      }
    },
    
    // Modern Tech: Rapid response system
    animations: {
      sparkle: {
        duration: 1500,          // 1.5s - quick insights
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        scale: { min: 1.0, max: 1.02 },
        opacity: { min: 0.95, max: 1.0 }
      },
      transition: {
        instant: 100,            // Near instant
        quick: 200,              // Fast feedback
        normal: 300              // Standard speed
      }
    },
    
    // Natural System: Stream-inspired behaviors
    natural: {
      pattern: 'sparkling',      // Quick, bright flashes
      depth: 'surface',          // Immediate visibility
      flow: 'radial',            // Expanding insights
      rhythm: {
        primary: 1500,           // Quick sparkle
        secondary: 3000,         // Background shimmer
        micro: 200               // Instant feedback
      }
    },
    
    typography: {
      hero: {
        fontSize: 'clamp(1.75rem, 3vw, 2rem)',
        fontWeight: 600,
        letterSpacing: '0',
        lineHeight: 1.4
      },
      title: {
        fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
        fontWeight: 500,
        lineHeight: 1.5
      },
      body: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.6,
        fontFeatureSettings: '"tnum"' // Tabular numbers for data
      }
    }
  },
  
  // Shared semantic colors across all psychology levels
  semantic: {
    success: {
      light: '#10b981',
      main: '#059669',
      dark: '#047857',
      surface: 'rgba(16, 185, 129, 0.1)'
    },
    warning: {
      light: '#f59e0b',
      main: '#d97706',
      dark: '#b45309',
      surface: 'rgba(245, 158, 11, 0.1)'
    },
    error: {
      light: '#ef4444',
      main: '#dc2626',
      dark: '#991b1b',
      surface: 'rgba(239, 68, 68, 0.1)'
    },
    info: {
      light: '#60a5fa',
      main: '#3b82f6',
      dark: '#1d4ed8',
      surface: 'rgba(96, 165, 250, 0.1)'
    }
  },
  
  // Living interface utilities
  utils: {
    // Get theme for psychology level
    getTheme: (level: 'trust' | 'confidence' | 'intelligence') => {
      return PsychologyTheme[level];
    },
    
    // Get appropriate transition duration
    getTransition: (level: string, speed: 'fast' | 'normal' | 'slow' = 'normal') => {
      const speedMap = {
        fast: 200,
        normal: 300,
        slow: 500
      };
      
      return speedMap[speed];
    },
    
    // Get breathing animation config
    getBreathing: (level: string) => {
      return { duration: 4000, easing: 'ease-in-out' };
    }
  }
};

// Type exports for TypeScript
export type PsychologyLevel = 'trust' | 'confidence' | 'intelligence';
export type PsychologyThemeType = typeof PsychologyTheme;
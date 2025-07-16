// Psychology-Driven Design Migration Utilities
// Vortex Creator Pattern: Ancient Wisdom + Modern Tech + Natural Systems

import { PsychologyTheme, PsychologyLevel } from '@/theme/psychology-theme';

// Component migration map
export const PsychologyMigrationMap = {
  // Executive/Management Level → Trust Foundation
  trust: [
    'GeneralManagerDashboard',
    'ExecutiveDashboard', 
    'StrategicOverview',
    'BoardReporting',
    'C-SuiteMetrics'
  ],
  
  // Financial/Decision Level → Confidence Building  
  confidence: [
    'FinanceDashboard',
    'CashFlowAnalysis',
    'PaymentTermsCalculator',
    'WorkingCapitalSimulator',
    'FinancialDrillDown',
    'ROIAnalysis',
    'BudgetPlanning'
  ],
  
  // Operational/Action Level → Intelligence Active
  intelligence: [
    'OperationalDashboard',
    'InventoryManagement',
    'PredictiveReordering',
    'SupplierHealthScoring',
    'LeadTimeIntelligence',
    'RealTimeAlerts',
    'ProcessAutomation'
  ]
};

// Migration utilities
export const PsychologyMigration = {
  // Determine psychology level for a component
  getComponentLevel: (componentName: string): PsychologyLevel => {
    for (const [level, components] of Object.entries(PsychologyMigrationMap)) {
      if (components.some(comp => componentName.includes(comp))) {
        return level as PsychologyLevel;
      }
    }
    // Default to confidence for unknown components
    return 'confidence';
  },
  
  // Generate migration config for a component
  getMigrationConfig: (componentName: string) => {
    const level = PsychologyMigration.getComponentLevel(componentName);
    const theme = PsychologyTheme[level];
    
    return {
      level,
      theme,
      colorReplacements: {
        // Trust level replacements
        trust: {
          'blue-600': theme.colors.primary,
          'blue-800': theme.colors.secondary,
          'blue-100': `${theme.colors.primary}10`,
          'gray-900': theme.colors.text.primary,
          'gray-600': theme.colors.text.secondary,
          'gray-500': theme.colors.text.muted
        },
        // Confidence level replacements
        confidence: {
          'blue-600': theme.colors.primary,
          'blue-500': theme.colors.accent,
          'blue-100': `${theme.colors.primary}10`,
          'gray-900': theme.colors.text.primary,
          'gray-700': theme.colors.text.secondary,
          'gray-500': theme.colors.text.muted
        },
        // Intelligence level replacements
        intelligence: {
          'blue-600': theme.colors.primary,
          'blue-400': theme.colors.secondary,
          'sky-600': theme.colors.accent,
          'gray-900': theme.colors.text.primary,
          'gray-600': theme.colors.text.secondary,
          'gray-400': theme.colors.text.muted
        }
      }[level],
      
      animationReplacements: {
        // Trust animations (slow, deliberate)
        trust: {
          'duration-300': `duration-[${theme.animations.transition.slow}ms]`,
          'duration-500': `duration-[${theme.animations.transition.normal}ms]`,
          'duration-700': `duration-[${theme.animations.transition.entrance}ms]`,
          'delay-100': 'delay-[200ms]',
          'delay-200': 'delay-[400ms]',
          'delay-300': 'delay-[600ms]'
        },
        // Confidence animations (balanced)
        confidence: {
          'duration-200': `duration-[${theme.animations.transition.fast}ms]`,
          'duration-300': `duration-[${theme.animations.transition.normal}ms]`,
          'duration-500': `duration-[${theme.animations.transition.smooth}ms]`,
          'delay-100': 'delay-[100ms]',
          'delay-200': 'delay-[200ms]',
          'delay-300': 'delay-[300ms]'
        },
        // Intelligence animations (fast, responsive)
        intelligence: {
          'duration-150': `duration-[${theme.animations.transition.instant}ms]`,
          'duration-200': `duration-[${theme.animations.transition.quick}ms]`,
          'duration-300': `duration-[${theme.animations.transition.normal}ms]`,
          'delay-75': 'delay-[50ms]',
          'delay-100': 'delay-[75ms]',
          'delay-200': 'delay-[100ms]'
        }
      }[level],
      
      typographyConfig: theme.typography,
      naturalBehavior: theme.natural
    };
  },
  
  // Generate wrapper components
  generateWrapper: (componentName: string, level: PsychologyLevel) => {
    const theme = PsychologyTheme[level];
    
    return `
import { motion } from 'framer-motion';
import { PsychologyTheme } from '@/theme/psychology-theme';
import BreathingContainer from '@/components/magic/BreathingContainer';
import ${componentName} from '@/components/${componentName}';

export default function Psychology${componentName}(props: any) {
  const theme = PsychologyTheme.${level};
  
  return (
    <BreathingContainer psychologyLevel="${level}" intensity={1}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: theme.animations.transition.${level === 'trust' ? 'entrance' : level === 'confidence' ? 'smooth' : 'quick'} / 1000 }}
      >
        <${componentName} {...props} />
      </motion.div>
    </BreathingContainer>
  );
}
`;
  },
  
  // Batch migration helper
  migrateComponents: (components: string[], targetLevel?: PsychologyLevel) => {
    const migrations = components.map(component => {
      const level = targetLevel || PsychologyMigration.getComponentLevel(component);
      const config = PsychologyMigration.getMigrationConfig(component);
      
      return {
        component,
        level,
        config,
        wrapper: PsychologyMigration.generateWrapper(component, level)
      };
    });
    
    return {
      migrations,
      summary: {
        total: migrations.length,
        byLevel: {
          trust: migrations.filter(m => m.level === 'trust').length,
          confidence: migrations.filter(m => m.level === 'confidence').length,
          intelligence: migrations.filter(m => m.level === 'intelligence').length
        }
      }
    };
  },
  
  // Living interface patterns by psychology level
  getLivingPattern: (level: PsychologyLevel) => {
    const patterns = {
      trust: {
        name: 'Breathing Authority',
        description: 'Slow, deep breathing that commands respect',
        implementation: `
// Breathing effect for trust
const breathingVariants = {
  initial: { scale: 1, opacity: 0.95 },
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.95, 1, 0.95],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
`
      },
      confidence: {
        name: 'Flowing Decision',
        description: 'River-like flow that guides decisions',
        implementation: `
// Flowing effect for confidence
const flowingVariants = {
  initial: { x: -100, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};
`
      },
      intelligence: {
        name: 'Sparkling Insight',
        description: 'Quick flashes of intelligence and action',
        implementation: `
// Sparkling effect for intelligence
const sparkleVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 0],
    opacity: [0, 1, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      stagger: 0.2
    }
  }
};
`
      }
    };
    
    return patterns[level];
  }
};

// Export convenience functions
export const migrateToTrust = (component: string) => 
  PsychologyMigration.getMigrationConfig(component);

export const migrateToConfidence = (component: string) => 
  PsychologyMigration.getMigrationConfig(component);

export const migrateToIntelligence = (component: string) => 
  PsychologyMigration.getMigrationConfig(component);

// Batch migration presets
export const MigrationPresets = {
  // Migrate all executive dashboards
  migrateExecutive: () => 
    PsychologyMigration.migrateComponents(PsychologyMigrationMap.trust, 'trust'),
  
  // Migrate all financial dashboards
  migrateFinancial: () => 
    PsychologyMigration.migrateComponents(PsychologyMigrationMap.confidence, 'confidence'),
  
  // Migrate all operational dashboards
  migrateOperational: () => 
    PsychologyMigration.migrateComponents(PsychologyMigrationMap.intelligence, 'intelligence'),
  
  // Migrate entire platform
  migrateAll: () => {
    const allComponents = [
      ...PsychologyMigrationMap.trust,
      ...PsychologyMigrationMap.confidence,
      ...PsychologyMigrationMap.intelligence
    ];
    return PsychologyMigration.migrateComponents(allComponents);
  }
};
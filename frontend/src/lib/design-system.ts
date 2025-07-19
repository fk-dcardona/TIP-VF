// Design System Utilities and Constants

export const colors = {
  // Brand Colors
  primary: {
    50: '#E6F2FF',
    100: '#CCE5FF',
    200: '#99CCFF',
    300: '#66B2FF',
    400: '#3399FF',
    500: '#0066CC',
    600: '#0052A3',
    700: '#003D7A',
    800: '#002952',
    900: '#001429',
  },
  secondary: {
    50: '#E6F7F0',
    100: '#CCEFE1',
    200: '#99DFC3',
    300: '#66CFA5',
    400: '#33BF87',
    500: '#00AA44',
    600: '#008836',
    700: '#006628',
    800: '#00441B',
    900: '#00220D',
  },
  // Semantic Colors
  success: {
    light: '#4CAF50',
    main: '#2E7D32',
    dark: '#1B5E20',
  },
  warning: {
    light: '#FFB74D',
    main: '#F57C00',
    dark: '#E65100',
  },
  error: {
    light: '#E57373',
    main: '#D32F2F',
    dark: '#B71C1C',
  },
  info: {
    light: '#64B5F6',
    main: '#1976D2',
    dark: '#0D47A1',
  },
};

// Chart Color Palettes
export const chartColors = {
  categorical: [
    colors.primary[500],
    colors.secondary[500],
    colors.warning.main,
    '#7B61FF',
    '#E91E63',
    '#00BCD4',
  ],
  sequential: {
    blue: [colors.primary[50], colors.primary[200], colors.primary[400], colors.primary[500], colors.primary[700]],
    green: [colors.secondary[50], colors.secondary[200], colors.secondary[400], colors.secondary[500], colors.secondary[700]],
    heat: ['#FFF3E0', '#FFB74D', '#F57C00', '#E65100', '#BF360C'],
  },
  diverging: {
    redBlue: [colors.error.main, colors.error.light, '#FFFFFF', colors.info.light, colors.info.main],
    greenPurple: [colors.secondary[500], colors.secondary[300], '#FFFFFF', '#9C88FF', '#6C5CE7'],
  },
};

// Animation Configurations
export const animations = {
  breathing: {
    duration: 4000,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    scale: { min: 0.98, max: 1.02 },
    opacity: { min: 0.8, max: 1 },
  },
  waterFlow: {
    duration: 20000,
    waveHeight: 20,
    waveCount: 3,
    easing: 'linear',
  },
  growth: {
    duration: 2000,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    stagger: 100,
  },
  transitions: {
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 1000,
  },
};

// Typography Scale
export const typography = {
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing Scale
export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};

// Border Radius Scale
export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  default: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  full: '9999px',
};

// Shadow Scale
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Helper function to generate consistent class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Helper to get color value by path (e.g., 'primary.500')
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: any = colors;
  
  for (const part of parts) {
    value = value[part];
    if (!value) return '#000000';
  }
  
  return value;
}

// Generate chart theme for Recharts
export function getChartTheme() {
  return {
    colors: chartColors.categorical,
    grid: {
      stroke: '#E2E8F0',
      strokeDasharray: '3 3',
    },
    axis: {
      style: {
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        fill: '#718096',
      },
    },
    tooltip: {
      contentStyle: {
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        boxShadow: shadows.lg,
      },
      labelStyle: {
        color: '#1A202C',
        fontWeight: 600,
        marginBottom: '0.25rem',
      },
    },
    legend: {
      wrapperStyle: {
        paddingTop: '1rem',
      },
      iconType: 'circle',
      iconSize: 10,
    },
  };
}
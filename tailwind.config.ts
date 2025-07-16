import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
          DEFAULT: '#0066CC',
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
          DEFAULT: '#00AA44',
        },
        // Semantic Colors
        success: {
          light: '#4CAF50',
          DEFAULT: '#2E7D32',
          dark: '#1B5E20',
        },
        warning: {
          light: '#FFB74D',
          DEFAULT: '#F57C00',
          dark: '#E65100',
        },
        error: {
          light: '#E57373',
          DEFAULT: '#D32F2F',
          dark: '#B71C1C',
        },
        info: {
          light: '#64B5F6',
          DEFAULT: '#1976D2',
          dark: '#0D47A1',
        },
        // UI Colors
        background: {
          primary: '#FFFFFF',
          secondary: '#F8FAFB',
          tertiary: '#F0F4F7',
          elevated: '#FFFFFF',
          overlay: 'rgba(0, 0, 0, 0.5)',
        },
        text: {
          primary: '#1A202C',
          secondary: '#4A5568',
          tertiary: '#718096',
          disabled: '#A0AEC0',
          inverse: '#FFFFFF',
        },
        border: {
          light: '#E2E8F0',
          DEFAULT: '#CBD5E0',
          dark: '#A0AEC0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      animation: {
        // Living Interface animations
        'breathing': 'breathing 4s ease-in-out infinite',
        'water-flow': 'water-flow 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'growth': 'growth 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        // Existing animations
        'blob': 'blob 7s infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-delay': 'fadeIn 0.6s ease-out 0.2s both',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-up-delay': 'slideUp 0.6s ease-out 0.2s both',
        'slide-up-delay-2': 'slideUp 0.6s ease-out 0.4s both',
        'slide-up-delay-3': 'slideUp 0.6s ease-out 0.6s both',
        'slide-up-delay-4': 'slideUp 0.6s ease-out 0.8s both',
      },
      keyframes: {
        breathing: {
          '0%, 100%': { transform: 'scale(0.98)', opacity: '0.9' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
        'water-flow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        growth: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { 
            opacity: '0', 
            transform: 'translateY(30px)',
          },
          to: { 
            opacity: '1', 
            transform: 'translateY(0)',
          },
        },
      },
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
        '2000': '2000ms',
      },
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    },
  },
  plugins: [],
}

export default config
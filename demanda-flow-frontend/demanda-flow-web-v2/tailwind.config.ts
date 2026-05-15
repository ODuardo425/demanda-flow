import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        ivory: '#FAFBFA',
        cream: '#F1F5F4',
        bone: '#E5E7EB',

        // Inks
        ink: '#0A0F0E',
        ash: '#6B7280',

        // Verde elétrico (cor de marca — substitui rust)
        rust: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },

        // Verde-lima ultra elétrico (acentos)
        volt: {
          DEFAULT: '#A3E635',
          400: '#A3E635',
          500: '#84CC16',
          600: '#65A30D',
        },

        // Verde escuro premium (dark background)
        forest: {
          DEFAULT: '#0F1F1A',
          900: '#0A1612',
          800: '#0F1F1A',
          700: '#152B24',
        },

        moss: '#15803D',
        amber: '#D97706',
        ruby: '#DC2626',
      },
      fontFamily: {
        serif: ['"Sora"', 'system-ui', 'sans-serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10, 15, 14, 0.04), 0 2px 8px rgba(10, 15, 14, 0.04)',
        lift: '0 2px 8px rgba(10, 15, 14, 0.06), 0 12px 32px rgba(10, 15, 14, 0.08)',
        glow: '0 0 0 4px rgba(16, 185, 129, 0.15)',
        volt: '0 0 24px rgba(163, 230, 53, 0.4)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        charge: 'charge 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.5)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
        },
        charge: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

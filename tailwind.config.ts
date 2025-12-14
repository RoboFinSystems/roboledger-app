import tailwindcssTypography from '@tailwindcss/typography'
import flowbiteReact from 'flowbite-react/plugin/tailwindcss'
import flowbitePlugin from 'flowbite/plugin'
import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
    '.flowbite-react/class-list.json',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // RoboLedger Brand Colors
        primary: {
          50: '#EFF6FF', // Lightest blue for backgrounds
          100: '#DBEAFE', // Light blue for hover states
          200: '#BFDBFE', // Soft blue for borders
          300: '#93BBFD', // Medium light blue
          400: '#6098FA', // Medium blue
          500: '#3B7AF5', // Bright blue
          600: '#2563EB', // Strong blue
          700: '#1D4ED8', // Deep blue
          800: '#1B3A57', // Brand primary (dark blue)
          900: '#1E3A8A', // Darker blue
          950: '#172E47', // Darkest blue
        },
        secondary: {
          50: '#E6FFFA', // Lightest teal
          100: '#B2FFF0', // Very light green
          200: '#7FFFE6', // Light green
          300: '#4CFFDB', // Bright light green
          400: '#1AFFD1', // Bright green
          500: '#00D4AA', // Brand secondary (bright green)
          600: '#00B894', // Medium green
          700: '#009B7D', // Deep green
          800: '#007D65', // Darker green
          900: '#00604D', // Very dark green
          950: '#004438', // Darkest green
        },
        accent: {
          50: '#FFF5F0', // Lightest orange
          100: '#FFE6D9', // Very light orange
          200: '#FFD4C1', // Light orange
          300: '#FFBFA6', // Soft orange
          400: '#FFA589', // Medium orange
          500: '#FF6B35', // Brand accent (warm orange)
          600: '#F54E17', // Strong orange
          700: '#DC4313', // Deep orange
          800: '#B93810', // Dark orange
          900: '#962D0D', // Very dark orange
          950: '#731F08', // Darkest orange
        },
        graph: {
          node: {
            primary: '#00D4AA', // Primary nodes
            secondary: '#3B7AF5', // Secondary nodes
            accent: '#FF6B35', // Important/highlight nodes
            inactive: '#94A3B8', // Inactive nodes
          },
          edge: {
            primary: '#93BBFD', // Primary relationships
            secondary: '#7FFFE6', // Secondary relationships
            highlight: '#FFA589', // Highlighted paths
            inactive: '#CBD5E1', // Inactive edges
          },
          cluster: {
            bg: 'rgba(59, 122, 245, 0.05)', // Cluster backgrounds
            border: '#BFDBFE', // Cluster borders
          },
        },
        semantic: {
          success: '#00D4AA', // Using secondary green
          warning: '#FF6B35', // Using accent orange
          error: '#DC2626', // Red for errors
          info: '#3B7AF5', // Using primary blue
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-knowledge':
          'linear-gradient(135deg, #1B3A57 0%, #00D4AA 50%, #FF6B35 100%)',
        'gradient-primary': 'linear-gradient(135deg, #1B3A57 0%, #3B7AF5 100%)',
        'gradient-secondary':
          'linear-gradient(135deg, #00B894 0%, #00D4AA 50%, #1AFFD1 100%)',
        'gradient-accent':
          'linear-gradient(135deg, #DC4313 0%, #FF6B35 50%, #FFA589 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(27, 58, 87, 0.3)',
        'glow-secondary': '0 0 20px rgba(0, 212, 170, 0.3)',
        'glow-accent': '0 0 20px rgba(255, 107, 53, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 170, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'float-slower': 'float-slower 12s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
        },
        'float-slower': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-15px) translateX(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#374151',
            h1: {
              color: '#1B3A57',
              fontSize: '2.25rem',
              fontWeight: '800',
            },
            h2: {
              color: '#1B3A57',
              fontSize: '1.875rem',
              fontWeight: '700',
            },
            h3: {
              color: '#1B3A57',
              fontSize: '1.5rem',
              fontWeight: '600',
            },
            h4: {
              color: '#1B3A57',
              fontSize: '1.25rem',
              fontWeight: '600',
            },
            a: {
              color: '#3B7AF5',
              '&:hover': {
                color: '#2563EB',
              },
            },
            code: {
              color: '#00D4AA',
              backgroundColor: '#E6FFFA',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            pre: {
              backgroundColor: '#1B3A57',
              color: '#E6FFFA',
            },
            blockquote: {
              borderLeftColor: '#00D4AA',
              color: '#4B5563',
            },
          },
        },
        dark: {
          css: {
            color: '#D1D5DB',
            h1: {
              color: '#F9FAFB',
            },
            h2: {
              color: '#F9FAFB',
            },
            h3: {
              color: '#F9FAFB',
            },
            h4: {
              color: '#F9FAFB',
            },
            a: {
              color: '#6098FA',
              '&:hover': {
                color: '#93BBFD',
              },
            },
            code: {
              color: '#1AFFD1',
              backgroundColor: 'rgba(0, 212, 170, 0.1)',
            },
            pre: {
              backgroundColor: '#111827',
              color: '#E5E7EB',
            },
            blockquote: {
              borderLeftColor: '#00D4AA',
              color: '#9CA3AF',
            },
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
    fontFamily: {
      body: [
        'Space Grotesk',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'system-ui',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
      ],
      sans: [
        'Space Grotesk',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'system-ui',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
      ],
      heading: [
        'Orbitron',
        'Space Grotesk',
        'ui-sans-serif',
        'system-ui',
        'sans-serif',
      ],
      mono: [
        'JetBrains Mono',
        'ui-monospace',
        'SFMono-Regular',
        'SF Mono',
        'Menlo',
        'Consolas',
        'Liberation Mono',
        'monospace',
      ],
    },
  },
  plugins: [flowbitePlugin, flowbiteReact, tailwindcssTypography],
} satisfies Config

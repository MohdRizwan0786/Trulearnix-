import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    screens: {
      'xs': '400px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: { DEFAULT: '#6366f1', 50: '#eef2ff', 100: '#e0e7ff', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
        secondary: { DEFAULT: '#8b5cf6', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        dark: { DEFAULT: '#080b14', 900: '#080b14', 800: '#0d1120', 700: '#111827', 600: '#1a2235' },
        accent: { DEFAULT: '#f59e0b', 400: '#fbbf24', 500: '#f59e0b' }
      },
      fontFamily: { sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'] },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'marquee': 'marquee 35s linear infinite',
        'pulse-live': 'pulseLive 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        pulseLive: { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(1.4)' } },
      }
    }
  },
  plugins: []
}

export default config

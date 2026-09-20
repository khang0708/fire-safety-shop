/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fire: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        // Fallback aliases so legacy classes keep functioning gracefully
        botanical: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        blossom: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        surface: {
          cream: '#F8FAFC',
          paper: '#F1F5F9',
          card: '#FFFFFF',
        },
        charcoal: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'organic': '16px',
        'industrial': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        'organic-soft': '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
        'float-button': '0 8px 24px -4px rgba(220, 38, 38, 0.35)',
        'safety': '0 10px 25px -5px rgba(220, 38, 38, 0.2)',
        'glow-red': '0 0 20px -2px rgba(220, 38, 38, 0.4)',
      }
    },
  },
  plugins: [],
}

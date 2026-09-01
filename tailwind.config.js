/**
 * The design system in one file.
 * Calm, low-contrast, paper-like. Each life area has one accent colour that is
 * reused everywhere: sidebar icon, stat card, chart series.
 *
 * Colours resolve to CSS variables, so light and dark are one variable swap in
 * index.css and every `bg-canvas` / `text-ink` class keeps working untouched.
 * The `rgb(... / <alpha-value>)` form is what keeps `bg-expense/5` working.
 */
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: withAlpha('--canvas'),
        surface: withAlpha('--surface'),
        line: withAlpha('--line'),
        ink: withAlpha('--ink'),
        muted: withAlpha('--muted'),
        /** Backdrops, which must darken the page in both themes. */
        overlay: withAlpha('--overlay'),
        brand: {
          50: withAlpha('--brand-50'),
          100: withAlpha('--brand-100'),
          200: withAlpha('--brand-200'),
          300: withAlpha('--brand-300'),
          400: withAlpha('--brand-400'),
          500: withAlpha('--brand-500'),
          600: withAlpha('--brand-600'),
          700: withAlpha('--brand-700'),
          800: withAlpha('--brand-800'),
          900: withAlpha('--brand-900')
        },
        expense: withAlpha('--expense'),
        health: withAlpha('--health'),
        invest: withAlpha('--invest')
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif']
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        // Soft and shallow — depth without heaviness. Dark mode raises the
        // alpha through the variables, since a faint shadow vanishes there.
        card: '0 1px 2px rgb(var(--shadow) / var(--shadow-a1)), 0 8px 24px -12px rgb(var(--shadow) / var(--shadow-a2))',
        lift: '0 2px 4px rgb(var(--shadow) / var(--shadow-a2)), 0 16px 32px -16px rgb(var(--shadow) / var(--shadow-a3))'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        breathe: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        breathe: 'breathe 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

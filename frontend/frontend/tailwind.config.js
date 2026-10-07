/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        background: '#0b1120',
        surface: '#111827',
        card: '#0f172a',
        success: '#94a3b8',
        warning: '#94a3b8',
        danger: '#94a3b8',
      },
      boxShadow: {
        'soft-glow': '0 16px 48px rgba(0, 0, 0, 0.32)',
      },
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
  plugins: [],
}

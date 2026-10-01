/** @type {import('tailwindcss').Config} */
export default {
  content: [
     "./index.html",
     "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
     extend: {
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'none' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in .3s ease-out', 'slide-up': 'slide-up .25s ease-out' },
       colors: {
         brand: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
         },
         surface: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            800: '#151821',
              850: '#11131a',
              900: '#0c0e14',
              950: '#07080c',
           }
        },
        fontFamily: {
           sans: [
              'Inter',
              '-apple-system',
              'BlinkMacSystemFont',
              '"Segoe UI"',
              'Roboto',
              '"Noto Sans Devanagari"',
              'sans-serif'
           ],
           mono: [
              'JetBrains Mono',
              'SFMono-Regular',
              'Menlo',
              'Monaco',
              'Consolas',
              'monospace'
           ]
        },
        boxShadow: {
           'glow': '0 0 20px -5px rgba(245, 158, 11, 0.15)',
           'glow-teal': '0 0 20px -5px rgba(20, 184, 166, 0.15)',
           'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
           'elevated': '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
        }
     },
  },
  plugins: [],
}

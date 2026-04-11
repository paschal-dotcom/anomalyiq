/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body:    ['Cabinet Grotesk', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        teal:   '#0ABFBC',
        coral:  '#FC5C7D',
        amber:  '#F7B731',
        violet: '#7B5EA7',
        mint:   '#11998E',
        sky:    '#38B2F4',
        slate:  '#1A2332',
        muted:  '#64748B',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease forwards',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.5, transform: 'scale(1.3)' } },
      },
    },
  },
  plugins: [],
};

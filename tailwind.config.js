/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(148,163,184,0.18), 0 24px 60px rgba(15, 23, 42, 0.55)',
      },
    },
  },
  plugins: [],
};

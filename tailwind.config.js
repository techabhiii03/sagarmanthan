/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#16324F',
        primary: '#245B8A',
        'bg-page': '#F4F6F8',
        'border-base': '#D9E0E6',
        'text-main': '#1F2933',
        'text-sub':  '#66717E',
        success: '#287A4B',
        warning: '#B7791F',
        risk:    '#B23A3A',
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};

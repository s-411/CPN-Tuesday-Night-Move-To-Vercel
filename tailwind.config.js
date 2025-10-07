/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cpn-yellow': '#f2f661',
        'cpn-dark': '#1f1f1f',
        'cpn-dark2': '#2a2a2a',
        'cpn-gray': '#ababab',
      },
    },
  },
  plugins: [],
};

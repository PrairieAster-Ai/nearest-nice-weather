/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f1f8',
          100: '#e8e4f1',
          200: '#d4cce5',
          300: '#b8a8d3',
          400: '#9478bd',
          500: '#7563A8',
          600: '#664d8f',
          700: '#563f75',
          800: '#493562',
          900: '#3e2e52',
          950: '#261c33',
        },
        aster: '#7563A8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
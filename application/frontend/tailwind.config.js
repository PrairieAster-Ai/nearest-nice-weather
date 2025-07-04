/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#8DA8CC', // Polo Blue 3
          'blue-light': '#A8BDDA',
          'blue-dark': '#7493B8',
          purple: '#7563A8', // Deluge 4/3
          'purple-light': '#8A7ABC',
          'purple-dark': '#614F94',
        },
        prairie: {
          green: '#7CB342',
          'green-light': '#8BC34A',
          'green-dark': '#689F38',
        },
        warm: {
          gray: '#8E8E93',
          'gray-light': '#C7C7CC',
          'gray-dark': '#636366',
        },
        weather: {
          'cold-blue': '#2196F3',
          'comfortable-green': '#4CAF50',
          'hot-orange': '#FF9800',
          'rain-likely': '#607D8B',
          'rain-sporadic': '#9E9E9E',
          'rain-unlikely': '#E0E0E0',
          'wind-high': '#F44336',
          'wind-medium': '#FF9800',
          'wind-low': '#4CAF50',
        },
      },
      spacing: {
        'touch-min': '44px',
        'touch-ideal': '56px',
        'glove-friendly': '56px',
        '80': '20rem',  // 320px for sidebar width
        '84': '21rem',  // 336px for header left padding
      },
      fontFamily: {
        primary: ['Kaira', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        secondary: ['Arvo', 'Georgia', 'serif'],
        heading: ['Arkhip', 'Kaira', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
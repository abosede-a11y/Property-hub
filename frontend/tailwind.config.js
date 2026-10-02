/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17212B',
        harbour: {
          DEFAULT: '#1B2A3D',
          deep: '#101A26',
          light: '#33475F',
        },
        brass: {
          DEFAULT: '#A9793B',
          deep: '#8A6029',
          light: '#DCC08C',
        },
        stone: {
          DEFAULT: '#EFE9DD',
          dark: '#DED4C0',
        },
        chalk: '#F8F6F0',
        slate: '#5B6570',
        hedge: {
          DEFAULT: '#3F6B4E',
          light: '#E4EEE7',
        },
        rust: {
          DEFAULT: '#A6432C',
          light: '#F5E2DC',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Work Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

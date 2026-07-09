/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F5F0EB',
          dark: '#1C1C1E',
        },
        surface2: {
          DEFAULT: '#EDE8E1',
          dark: '#2C2C2E',
        },
        surface3: {
          DEFAULT: '#E3DDD5',
          dark: '#3A3A3C',
        },
        accentGold: {
          DEFAULT: '#C8954E',
          dark: '#D4A85C',
        },
        text: {
          DEFAULT: '#2C2C2E',
          dark: '#F5F0EB',
        },
        muted: {
          DEFAULT: '#8E8E93',
          dark: '#98989E',
        },
        accentGreen: {
          DEFAULT: '#34C759',
          dark: '#30D158',
        },
        accentRed: {
          DEFAULT: '#FF453A',
          dark: '#FF453A',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['System'],
      },
    },
  },
  plugins: [],
};

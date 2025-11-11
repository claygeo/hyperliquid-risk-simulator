/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark trading theme colors
        dark: {
          bg: '#0B0E11',
          surface: '#161A1E',
          border: '#1E2329',
          hover: '#2B3139',
        },
        // Trading colors
        green: {
          DEFAULT: '#0ECB81',
          dark: '#0B9A63',
        },
        red: {
          DEFAULT: '#F6465D',
          dark: '#C9354A',
        },
        // Accent colors
        primary: '#3B82F6',
        secondary: '#8B5CF6',
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#EF7D35',
          dark: '#7C2D12',
          light: '#FFF4EC',
          accent: '#F59E0B',
          bg: '#FFFAF5',
          card: '#FFFFFF',
          text: '#1F1410',
          muted: '#78655A',
          border: '#F3DCCB',
        },
        primary: {
          50:  '#FFF4EC',
          100: '#FDE5D3',
          200: '#FBCBA8',
          300: '#F7AB77',
          400: '#F39350',
          500: '#EF7D35',
          600: '#DC6422',
          700: '#B84E1A',
          800: '#94401A',
          900: '#7C2D12',
        },
        accent: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          50: '#FFFAF5',
          100: '#FFF1E6',
          200: '#F3DCCB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

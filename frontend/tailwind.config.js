/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#FFF5F7',
          100: '#FDEEF2',
          200: '#FADCE4',
          300: '#F6C6D4',
          400: '#F4A7B9',
          500: '#EC7FA0',
          600: '#D95F87',
          700: '#B84A6E',
        },
        ink: { DEFAULT: '#3A2E33', soft: '#6B5B62', light: '#9A8A90' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(216, 95, 135, 0.10)',
        card: '0 4px 20px rgba(58, 46, 51, 0.07)',
      },
    },
  },
  plugins: [],
}

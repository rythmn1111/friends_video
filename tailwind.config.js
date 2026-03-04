/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#f8f9fa',
          100: '#1a1a2e',
          200: '#16213e',
          300: '#0f3460',
          400: '#533483'
        }
      }
    }
  },
  plugins: []
}

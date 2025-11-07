/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-cyan': '#00ffff',
        'cyber-magenta': '#ff00ff',
        'cyber-purple': '#9d00ff',
        'cyber-blue': '#0066ff',
        'cyber-pink': '#ff1493',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(157, 0, 255, 0.5)',
      },
    },
  },
  plugins: [],
}

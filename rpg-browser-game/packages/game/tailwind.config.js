/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0e14',
          'bg-light': '#151a21',
          fg: '#b3b1ad',
          'fg-bright': '#e6e1cf',
          green: '#86d993',
          'green-bright': '#95e6a0',
          amber: '#ffb454',
          'amber-bright': '#ffc66d',
          cyan: '#5ccfe6',
          'cyan-bright': '#7fd8ed',
          red: '#f07178',
          'red-bright': '#ff8080',
          yellow: '#ffcc66',
          'yellow-bright': '#ffd891',
          blue: '#59c2ff',
          'blue-bright': '#73ccff',
          magenta: '#c594c5',
          'magenta-bright': '#d4a6d5',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'Monaco', '"Courier New"', 'Courier', 'monospace'],
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.97' },
        },
      },
      animation: {
        blink: 'blink 1s ease-in-out infinite',
        scanline: 'scanline 8s linear infinite',
        flicker: 'flicker 0.15s infinite',
      },
    },
  },
  plugins: [],
}

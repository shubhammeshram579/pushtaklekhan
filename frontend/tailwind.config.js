/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#1a1612',
          soft: '#3d342b',
          muted: '#7a6e62',
        },
        parchment: {
          DEFAULT: '#faf7f2',
          dark: '#f0ebe0',
          darker: '#e0d8ca',
        },
        amber: {
          inkwell: '#d4860a',
          light: '#fdf3dc',
          soft: '#f5d98a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2.5s ease-in-out infinite',
        'bounce-dot': 'bounce 0.9s ease infinite',
      },
    },
  },
  plugins: [],
};

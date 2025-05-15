import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand': {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#fce588',
          300: '#facc46',
          400: '#f5b111',
          500: '#e49104',
          600: '#c36a02',
          700: '#9a4a05',
          800: '#7c3a0a',
          900: '#67310c',
          950: '#3c1705',
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
        display: [
          "Montserrat",
          "Inter",
          "ui-sans-serif",
          "system-ui",
        ],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/img/barber-bg.jpg')",
      },
    },
  },
  plugins: [
    require("daisyui"),
    require('@tailwindcss/typography'),
  ],
  daisyui: {
    themes: [
      {
        barber: {
          "primary": "#e49104",
          "secondary": "#3c1705",
          "accent": "#facc46",
          "neutral": "#2a323c",
          "base-100": "#f5f5f4",
          "base-200": "#e7e5e4",
          "base-300": "#d6d3d1",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
} satisfies Config;

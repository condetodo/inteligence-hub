import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        horse: {
          black: "#1a1a1a",
          dark: "#32373c",
          "gray-700": "#4a4a4a",
          "gray-500": "#7a7a7a",
          "gray-400": "#9a9a9a",
          "gray-300": "#c4c4c4",
          "gray-200": "#e2e2e0",
          "gray-100": "#f0f0ee",
          bg: "#f5f5f3",
          white: "#ffffff",
          gold: "#f4c80e",
          "gold-hover": "#e0b800",
          "warm-bg": "#faf8f4",
          "warm-sidebar": "#fffcf7",
          "warm-border": "#e8e2d5",
          "warm-text": "#8a7a66",
          "warm-muted": "#a09080",
          "warm-subtle": "#b8a880",
          "warm-surface": "#f5efe4",
          "warm-active": "#f0e8d8",
        },
        status: {
          draft: "#d4a017",
          review: "#2d6cce",
          approved: "#2a9d5c",
          published: "#1a1a1a",
        },
        platform: {
          linkedin: "#0a66c2",
          x: "#1a1a1a",
          tiktok: "#c13584",
          blog: "#2a9d5c",
        },
      },
      keyframes: {
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;

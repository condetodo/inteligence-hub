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
    },
  },
  plugins: [],
};

export default config;

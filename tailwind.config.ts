import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0E14",
        panel: "#11151F",
        subtle: "#1A2030",
        border: "#273048",
        text: "#E6EDF3",
        muted: "#9BA7B4",
        brand: { DEFAULT: "#6E9BFF", 600: "#4F7EEA" }
      }
    }
  },
  plugins: []
} satisfies Config;


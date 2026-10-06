import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0d1424",
          hover: "#131c30",
        },
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        flow: "flow 2.4s ease-in-out infinite",
      },
      keyframes: {
        flow: {
          "0%, 100%": { opacity: "0.35", transform: "translateX(0)" },
          "50%": { opacity: "1", transform: "translateX(4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

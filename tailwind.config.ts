import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B0F1A",
          elevated: "#111726",
          subtle: "#161D2E",
        },
        border: {
          DEFAULT: "#1F2740",
          subtle: "#181F33",
        },
        text: {
          DEFAULT: "#E6E9F2",
          muted: "#8A93AB",
          subtle: "#5B6378",
        },
        brand: {
          magenta: "#E84C88",
          violet: "#8B5CF6",
          cyan: "#22D3EE",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #E84C88 0%, #8B5CF6 50%, #22D3EE 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

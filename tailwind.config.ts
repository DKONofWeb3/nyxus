import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── All colors reference CSS variables ──────────────
        // This means dark mode just swaps the variables and
        // every Tailwind class updates automatically.
        bg: {
          DEFAULT: "var(--bg)",
          2: "var(--bg2)",
        },
        surface: "var(--surface)",
        border:  "var(--border)",
        text: {
          DEFAULT: "var(--text)",
          2: "var(--text2)",
          3: "var(--text3)",
        },
        accent: {
          DEFAULT: "var(--accent)",
        },
        brand: {
          green:  "var(--green)",
          yellow: "var(--yellow)",
          blue:   "var(--blue)",
          red:    "var(--red)",
        },
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.05em",
        tighter:  "-0.03em",
      },
      boxShadow: {
        card:    "var(--shadow)",
        "card-lg": "var(--shadow-lg)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;

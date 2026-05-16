import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#fafaf8",
        surface: "#ffffff",
        border: "#e8e6e1",
        "border-hover": "#d4d0c8",
        text: "#1a1a1a",
        "text-secondary": "#6b6560",
        "text-muted": "#9c958d",
        accent: "#c77d2c",
        "accent-soft": "#fdf6ed",
      },
      fontFamily: {
        serif: ["Georgia", "Noto Serif SC", "STSong", "serif"],
        sans: ["Inter", "SF Pro Text", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Cascadia Code", "monospace"],
      },
      maxWidth: {
        content: "720px",
      },
    },
  },
  plugins: [],
};

export default config;

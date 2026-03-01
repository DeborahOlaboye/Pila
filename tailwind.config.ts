import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F0F11",
        surface: "#1A1A1F",
        border: "#2A2A35",
        primary: "#7C3AED",
        "primary-h": "#8B5CF6",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        "text-muted": "#6B7280",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "glow-pulse": "glowPulse 2s infinite",
        "ticker": "ticker 2s ease-out forwards",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        glowPulse: { "0%, 100%": { boxShadow: "0 0 0 0 rgba(124,58,237,0)" }, "50%": { boxShadow: "0 0 20px 4px rgba(124,58,237,0.3)" } },
        ticker: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-100%)" } },
      },
    },
  },
  plugins: [],
};

export default config;

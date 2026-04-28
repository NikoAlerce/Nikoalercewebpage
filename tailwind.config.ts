import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        ink: "#0a0a0a",
        bone: "#f5f5f0",
        ash: "#9a9a92",
        glitch: {
          red: "#ff0040",
          cyan: "#00fff0",
          magenta: "#ff00ff",
          lime: "#a3ff00",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "sans-serif"],
      },
      animation: {
        scan: "scan 8s linear infinite",
        flicker: "flicker 4s linear infinite",
        glitch: "glitch 2.5s infinite",
        "rgb-split": "rgbSplit 2s infinite",
        "noise-shift": "noiseShift 0.2s steps(2) infinite",
        marquee: "marquee 35s linear infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flicker: {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": { opacity: "1" },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": { opacity: "0.4" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 1px)" },
          "40%": { transform: "translate(-1px, -1px)" },
          "60%": { transform: "translate(1px, 1px)" },
          "80%": { transform: "translate(2px, -1px)" },
        },
        rgbSplit: {
          "0%, 100%": { textShadow: "0 0 0 transparent" },
          "50%": {
            textShadow:
              "-2px 0 #ff0040, 2px 0 #00fff0",
          },
        },
        noiseShift: {
          "0%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(-1px,1px)" },
          "100%": { transform: "translate(1px,-1px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

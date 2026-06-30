import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // ── Black / white / red. One bold accent, the rest is paper & ink. ──
        void: "#000000", // black
        ink: "#0b0b0c", // near-black panels
        coal: "#141416", // raised surface
        bone: "#f5f4ef", // warm off-white ("paper")
        ash: "#8f8f88", // warm grey (secondary text)
        accent: {
          DEFAULT: "#e3322b", // the brand red
          soft: "#ff5a4d", // lifted red for hovers on dark
          deep: "#b21e1a", // pressed / shadowed red
        },
        // Back-compat shims: the old neon "glitch" palette now resolves to the
        // black/white/red identity, so interior pages re-skin coherently
        // without per-file edits. Cyan/lime collapse to paper-white neutrals.
        glitch: {
          red: "#e3322b",
          cyan: "#e9e8e2",
          magenta: "#e3322b",
          lime: "#e9e8e2",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        // "display" now resolves to the same grotesque as body (Space Grotesk) — the serif
        // is retired; throwup (font-graffiti) is the only display face.
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        graffiti: ["var(--font-graffiti)", "Impact", "sans-serif"],
      },
      letterSpacing: {
        editorial: "0.18em",
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        "fade-up": "fadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

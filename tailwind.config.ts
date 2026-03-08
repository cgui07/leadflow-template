import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ─── Semantic ────────────────────────────────────────────────
        // primary é a cor principal da marca — usada em CTAs, links e destaques
        primary: {
          DEFAULT:  "#3366ff",
          hover:    "#1a45f5",
          active:   "#1332e1",
          light:    "#8eb9ff",
          lighter:  "#d9e9ff",
          ghost:    "#eef5ff",
          dark:     "#1629b6",
          darker:   "#111a57",
          muted:    "#5990ff",
          contrast: "#ffffff",
        },

        // ─── Blues ───────────────────────────────────────────────────
        blue: {
          DEFAULT:  "#3b82f6",
          sky:      "#38bdf8",
          royal:    "#2563eb",
          navy:     "#1e3a8a",
          ice:      "#bfdbfe",
          pale:     "#eff6ff",
          midnight: "#172554",
        },

        // ─── Purples ─────────────────────────────────────────────────
        purple: {
          DEFAULT:  "#7c3aed",
          violet:   "#6d28d9",
          lavender: "#a78bfa",
          lilac:    "#ddd6fe",
          plum:     "#4c1d95",
          pale:     "#f5f3ff",
          grape:    "#5b21b6",
        },

        // ─── Pinks ───────────────────────────────────────────────────
        pink: {
          DEFAULT:  "#ec4899",
          hot:      "#db2777",
          blush:    "#f9a8d4",
          rose:     "#fce7f3",
          magenta:  "#be185d",
          pale:     "#fdf2f8",
          fuchsia:  "#c026d3",
        },

        // ─── Reds ────────────────────────────────────────────────────
        red: {
          DEFAULT:  "#ef4444",
          crimson:  "#dc2626",
          coral:    "#f87171",
          blush:    "#fecaca",
          pale:     "#fef2f2",
          dark:     "#991b1b",
          darker:   "#450a0a",
        },

        // ─── Oranges ─────────────────────────────────────────────────
        orange: {
          DEFAULT:  "#f97316",
          amber:    "#f59e0b",
          peach:    "#fdba74",
          light:    "#fed7aa",
          pale:     "#fff7ed",
          dark:     "#c2570a",
          burn:     "#7c2d12",
        },

        // ─── Yellows ─────────────────────────────────────────────────
        yellow: {
          DEFAULT:  "#eab308",
          gold:     "#ca8a04",
          lemon:    "#fde047",
          butter:   "#fef08a",
          pale:     "#fefce8",
          dark:     "#a16207",
          mustard:  "#713f12",
        },

        // ─── Greens ──────────────────────────────────────────────────
        green: {
          DEFAULT:  "#22c55e",
          emerald:  "#10b981",
          lime:     "#84cc16",
          mint:     "#86efac",
          sage:     "#bbf7d0",
          pale:     "#f0fdf4",
          dark:     "#15803d",
          forest:   "#14532d",
        },

        // ─── Teals / Cyans ───────────────────────────────────────────
        teal: {
          DEFAULT:  "#14b8a6",
          cyan:     "#06b6d4",
          aqua:     "#67e8f9",
          mist:     "#ccfbf1",
          pale:     "#f0fdfa",
          dark:     "#0f766e",
          deep:     "#134e4a",
        },

        // ─── Grays ───────────────────────────────────────────────────
        gray: {
          DEFAULT:  "#6b7280",
          smoke:    "#9ca3af",
          silver:   "#d1d5db",
          ash:      "#e5e7eb",
          ghost:    "#f3f4f6",
          pale:     "#f9fafb",
          charcoal: "#374151",
          iron:     "#1f2937",
          jet:      "#111827",
        },

        // ─── Neutral (slate) ─────────────────────────────────────────
        neutral: {
          DEFAULT:  "#64748b",
          muted:    "#94a3b8",
          border:   "#e2e8f0",
          line:     "#cbd5e1",
          surface:  "#f8fafc",
          pale:     "#f1f5f9",
          dark:     "#334155",
          deep:     "#1e293b",
          ink:      "#0f172a",
        },

        // ─── Blacks & Whites ─────────────────────────────────────────
        black: {
          DEFAULT:  "#000000",
          rich:     "#0a0a0a",
          soft:     "#171717",
          fade:     "#1a1a1a",
        },

        white: {
          DEFAULT:  "#ffffff",
          off:      "#fafafa",
          cream:    "#f5f5f5",
          warm:     "#fffbf0",
        },

        // ─── Semantic aliases (CSS vars) ─────────────────────────────
        background: "var(--background)",
        foreground: "var(--foreground)",
      },

      // ─── Typography ──────────────────────────────────────────────────
      fontFamily: {
        sans:    ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        display: ["Cal Sans", "var(--font-geist-sans)", "Inter", "sans-serif"],
        body:    ["Inter", "var(--font-geist-sans)", "ui-sans-serif", "sans-serif"],
      },

      // ─── Spacing ─────────────────────────────────────────────────────
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
        "128": "32rem",
        "144": "36rem",
      },

      // ─── Border Radius ───────────────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // ─── Shadows ─────────────────────────────────────────────────────
      boxShadow: {
        soft:          "0 2px 15px -3px rgba(0,0,0,.07), 0 10px 20px -2px rgba(0,0,0,.04)",
        card:          "0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)",
        "primary-glow": "0 0 20px rgba(51,102,255,.35)",
      },

      // ─── Animations ──────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in .3s ease-out both",
      },

      // ─── Max Width ───────────────────────────────────────────────────
      maxWidth: {
        "8xl":  "88rem",
        "9xl":  "96rem",
      },
    },
  },
  plugins: [],
};

export default config;

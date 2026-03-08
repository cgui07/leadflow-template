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
      // ─── Brand Colors ───────────────────────────────────────────────
      colors: {
        // Primary — main brand color (used for CTAs, highlights, links)
        primary: {
          50:  "#eef5ff",
          100: "#d9e9ff",
          200: "#bcd5ff",
          300: "#8eb9ff",
          400: "#5990ff",
          500: "#3366ff", // base
          600: "#1a45f5",
          700: "#1332e1",
          800: "#1629b6",
          900: "#172890",
          950: "#111a57",
        },

        // Secondary — accent / supporting color
        secondary: {
          50:  "#f3f0ff",
          100: "#e9e4ff",
          200: "#d5ccff",
          300: "#b5a6ff",
          400: "#9173ff",
          500: "#7247ff", // base
          600: "#6226f7",
          700: "#5419e3",
          800: "#4516bf",
          900: "#39139c",
          950: "#220a6a",
        },

        // Accent — highlights, badges, tags
        accent: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316", // base
          600: "#ea6c0a",
          700: "#c2570a",
          800: "#9a4510",
          900: "#7c3a10",
          950: "#431c06",
        },

        // Success — confirmations, completed states
        success: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e", // base
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },

        // Warning — alerts, pending states
        warning: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // base
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },

        // Danger — errors, destructive actions
        danger: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e", // base
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519",
        },

        // Neutral — text, backgrounds, borders
        neutral: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },

        // Surface — cards, panels, modals
        surface: {
          DEFAULT: "#ffffff",
          dark:    "#0f172a",
          muted:   "#f8fafc",
        },

        // Semantic aliases (CSS vars for easy dark-mode swap)
        background: "var(--background)",
        foreground: "var(--foreground)",
      },

      // ─── Typography ─────────────────────────────────────────────────
      fontFamily: {
        sans:    ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        display: ["Cal Sans", "var(--font-geist-sans)", "Inter", "sans-serif"],
        body:    ["Inter", "var(--font-geist-sans)", "ui-sans-serif", "sans-serif"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },

      // ─── Spacing & Sizing ────────────────────────────────────────────
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

      // ─── Box Shadow ──────────────────────────────────────────────────
      boxShadow: {
        soft:    "0 2px 15px -3px rgba(0,0,0,.07), 0 10px 20px -2px rgba(0,0,0,.04)",
        card:    "0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)",
        "primary-glow": "0 0 20px rgba(51,102,255,.35)",
        "accent-glow":  "0 0 20px rgba(249,115,22,.35)",
      },

      // ─── Animations ──────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        pulse_soft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: ".6" },
        },
      },
      animation: {
        "fade-in":   "fade-in .3s ease-out both",
        "slide-in":  "slide-in .25s ease-out both",
        "pulse-soft": "pulse_soft 2s ease-in-out infinite",
      },

      // ─── Z-Index ─────────────────────────────────────────────────────
      zIndex: {
        "60":  "60",
        "70":  "70",
        "80":  "80",
        "90":  "90",
        "100": "100",
      },

      // ─── Max Width ───────────────────────────────────────────────────
      maxWidth: {
        "8xl":  "88rem",
        "9xl":  "96rem",
        "10xl": "104rem",
      },
    },
  },
  plugins: [],
};

export default config;

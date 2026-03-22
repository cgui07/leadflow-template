import type { Config } from "tailwindcss";

export const appColors = {
  primary:   "#3366ff",
  secondary: "#7c3aed",
  accent:    "#f97316",
  success:   "#22c55e",
  warning:   "#eab308",
  danger:    "#ef4444",
  info:      "#38bdf8",
  "primary-10": "#3366ff1a",
  "primary-70": "#3366ffb3",
  "success-20": "#22c55e33",
  "warning-5": "#eab3080d",
  "warning-30": "#eab3084d",
  "danger-10": "#ef44441a",
  "info-10": "#38bdf81a",
  "black-50": "#00000080",
  "white-5": "#ffffff0d",
  "white-6": "#ffffff0f",
  "white-7": "#ffffff12",
  "white-8": "#ffffff14",
  "white-10": "#ffffff1a",
  "white-15": "#ffffff26",
  "white-20": "#ffffff33",
  "white-35": "#ffffff59",
  "white-55": "#ffffff8c",
  "white-70": "#ffffffb3",
  "white-78": "#ffffffc7",
  "white-85": "#ffffffd9",
  "white-90": "#ffffffe6",
  "white-95": "#fffffff2",
  "blue-ice-60": "#bfdbfe99",
  "blue-ice-70": "#bfdbfeb3",
  "blue-ice-80": "#bfdbfecc",
  "green-mint-10": "#86efac1a",
  "green-mint-40": "#86efac66",
  "green-emerald-18": "#10b9812e",
  "orange-amber-15": "#f59e0b26",
  "yellow-butter-12": "#fef08a1f",
  "teal-dark-15": "#0f766e26",
  "red-pale-50": "#fef2f280",
  "neutral-surface-50": "#f8fafc80",
  whatsapp: "#25D366",
  "whatsapp-dark": "#1fbe5a",

  blue: {
    DEFAULT:  "#3b82f6",
    sky:      "#38bdf8",
    royal:    "#2563eb",
    navy:     "#1e3a8a",
    ice:      "#bfdbfe",
    pale:     "#eff6ff",
    midnight: "#172554",
  },

  indigo: {
    DEFAULT: "#6366f1",
    deep:    "#4f46e5",
    pale:    "#eef2ff",
  },

  purple: {
    DEFAULT:  "#7c3aed",
    amethyst: "#8b5cf6",
    violet:   "#6d28d9",
    lavender: "#a78bfa",
    lilac:    "#ddd6fe",
    plum:     "#4c1d95",
    pale:     "#f5f3ff",
    grape:    "#5b21b6",
  },

  pink: {
    DEFAULT:  "#ec4899",
    hot:      "#db2777",
    blush:    "#f9a8d4",
    rose:     "#fce7f3",
    magenta:  "#be185d",
    pale:     "#fdf2f8",
    fuchsia:  "#c026d3",
  },

  red: {
    DEFAULT:  "#ef4444",
    crimson:  "#dc2626",
    coral:    "#f87171",
    blush:    "#fecaca",
    pale:     "#fef2f2",
    dark:     "#991b1b",
    darker:   "#450a0a",
  },

  orange: {
    DEFAULT: "#f97316",
    amber:   "#f59e0b",
    peach:   "#fdba74",
    light:   "#fed7aa",
    pale:    "#fff7ed",
    dark:    "#c2570a",
    burn:    "#7c2d12",
  },

  yellow: {
    DEFAULT: "#eab308",
    gold:    "#ca8a04",
    lemon:   "#fde047",
    butter:  "#fef08a",
    pale:    "#fefce8",
    dark:    "#a16207",
    mustard: "#713f12",
  },

  green: {
    DEFAULT: "#22c55e",
    emerald: "#10b981",
    lime:    "#84cc16",
    mint:    "#86efac",
    sage:    "#bbf7d0",
    pale:    "#f0fdf4",
    dark:    "#15803d",
    forest:  "#14532d",
  },

  teal: {
    DEFAULT: "#14b8a6",
    cyan:    "#06b6d4",
    aqua:    "#67e8f9",
    mist:    "#ccfbf1",
    pale:    "#f0fdfa",
    dark:    "#0f766e",
    deep:    "#134e4a",
  },

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

  neutral: {
    DEFAULT: "#64748b",
    muted:   "#94a3b8",
    border:  "#e2e8f0",
    line:    "#cbd5e1",
    surface: "#f8fafc",
    pale:    "#f1f5f9",
    steel:   "#475569",
    dark:    "#334155",
    deep:    "#1e293b",
    ink:     "#0f172a",
  },

  black: {
    DEFAULT: "#000000",
    rich:    "#0a0a0a",
    soft:    "#171717",
    fade:    "#1a1a1a",
  },

  white: {
    DEFAULT: "#ffffff",
    off:     "#fafafa",
    cream:   "#f5f5f5",
    warm:    "#fffbf0",
  },

  google: {
    blue:   "#4285f4",
    green:  "#34a853",
    yellow: "#fbbc05",
    red:    "#ea4335",
  },
} as const;

export const appBoxShadows = {
  soft:           "0 2px 15px -3px rgba(0,0,0,.07), 0 10px 20px -2px rgba(0,0,0,.04)",
  card:           "0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)",
  "primary-glow": "0 0 20px rgba(51,102,255,.35)",
  hero:           "0 32px 90px rgba(41,37,36,0.22)",
  "hero-soft":    "0 24px 70px rgba(41,37,36,0.18)",
} as const;

export const appBackgroundImages = {
  "landing-hero":
    "radial-gradient(circle at top left, rgba(15,118,110,0.18), transparent 34%), radial-gradient(circle at top right, rgba(202,138,4,0.18), transparent 28%), linear-gradient(180deg, #fffbf0 0%, #ffffff 46%, #f5f5f5 100%)",
  "landing-flow-journey":
    "radial-gradient(circle at top left, rgba(103,232,249,0.16), transparent 26%), radial-gradient(circle at bottom right, rgba(250,204,21,0.18), transparent 30%), linear-gradient(180deg, #0f172a 0%, #111827 100%)",
} as const;

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
        background: "var(--background)",
        foreground: "var(--foreground)",
        ...appColors,
      },

      fontFamily: {
        sans:    ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        display: ["Cal Sans", "var(--font-geist-sans)", "Inter", "sans-serif"],
        body:    ["Inter", "var(--font-geist-sans)", "ui-sans-serif", "sans-serif"],
      },

      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
        "128": "32rem",
        "144": "36rem",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      boxShadow: {
        ...appBoxShadows,
      },

      backgroundImage: {
        ...appBackgroundImages,
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "progress-bar": {
          from: { width: "0%" },
          to:   { width: "70%" },
        },
      },

      animation: {
        "fade-in": "fade-in .3s ease-out both",
        "progress-bar": "progress-bar 8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
      },

      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
    },
  },
  plugins: [],
};

export default config;

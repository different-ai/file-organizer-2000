import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#FBF4EA",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7C2FFF",
          foreground: "#FFFFFF",
          50: "#f5f1ff",
          100: "#ece5ff",
          200: "#daccff",
          300: "#bea4ff",
          400: "#9b6bff",
          500: "#8a4dff",
          600: "#7c2fff",
          700: "#6b1ddc",
          800: "#5a1bb8",
          900: "#4b1a94",
          950: "#2d1066",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          background: "#f8fafc",
        },
      },
      borderWidth: {
        1: "1px",
      },
      borderColor: {
        DEFAULT: "hsl(var(--border))",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.5rem",
        sm: "0.5rem",
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;

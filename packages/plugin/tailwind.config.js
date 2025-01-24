/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.{js,jsx,ts,tsx}',
    '!./node_modules/**/*',
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--background-modifier-border)",
        input: "var(--background-modifier-form-field)",
        ring: "var(--background-modifier-border-focus)",
        background: "var(--background-primary)",
        foreground: "var(--text-normal)",
        primary: {
          DEFAULT: "var(--interactive-accent)",
          foreground: "var(--text-on-accent)",
        },
        secondary: {
          DEFAULT: "var(--background-secondary)",
          foreground: "var(--text-normal)",
        },
        muted: {
          DEFAULT: "var(--background-secondary)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--interactive-accent)",
          foreground: "var(--text-on-accent)",
        },
        destructive: {
          DEFAULT: "var(--text-error)",
          foreground: "var(--text-on-accent)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
  // make sure to only use the tailwind classes
  corePlugins: {
    // get rid of any pre-esiting styling

    // make sure to only use the tailwind classes
    preflight: false,
  },
  important: true,
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.{js,jsx,ts,tsx}',
    '!./node_modules/**/*',
  ],
  theme: {
    extend: {
      // Extend colors to support Obsidian theme variables
      colors: {
        'obsidian': {
          'accent': 'hsl(var(--accent-h), var(--accent-s), var(--accent-l))',
          'bg-primary': 'var(--background-primary)',
          'bg-secondary': 'var(--background-secondary)',
          'text-normal': 'var(--text-normal)',
          'text-muted': 'var(--text-muted)',
          'text-faint': 'var(--text-faint)',
          'text-error': 'var(--text-error)',
          'text-success': 'var(--text-success)',
          'text-warning': 'var(--text-warning)',
          'interactive': 'var(--interactive-normal)',
          'interactive-hover': 'var(--interactive-hover)',
          'interactive-accent': 'var(--interactive-accent)',
        }
      },
      backgroundColor: {
        'modifier': {
          'hover': 'var(--background-modifier-hover)',
          'active': 'var(--background-modifier-active-hover)',
          'border': 'var(--background-modifier-border)',
        }
      },
    },
  },
  plugins: [],
  // Prevent Tailwind from purging styles with CSS variable references

}

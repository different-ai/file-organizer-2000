/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.{js,jsx,ts,tsx}',
    '!./node_modules/**/*',
  ],
  theme: {
      extend: {
          // Extend theme to use Obsidian CSS variables
          colors: {
              'obsidian': {
                  'text': 'var(--text-normal)',
                  'muted': 'var(--text-muted)',
              'faint': 'var(--text-faint)',
                  'accent': 'var(--text-accent)',
                  'background': 'var(--background-primary)',
                  'error': 'var(--text-error)',
                  'success': 'var(--text-success)',
              }
          },
      },
  },
  plugins: [],
  corePlugins: {
      preflight: false, // Keeps Obsidian's base styles
  },
}

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./plugin/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    corePlugins: {
        preflight: false, // This prevents Tailwind from injecting its base styles
    },
    important: true, // Changed from '.fo2k' to true
}

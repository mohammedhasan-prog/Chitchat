/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "error-dim": "#9f0519", "on-secondary-container": "#203ea2", "on-primary-fixed-variant": "#002a61", "on-surface": "#2d2f33", "on-tertiary-fixed-variant": "#006826", "surface-variant": "#dbdde3", "on-secondary-fixed-variant": "#2c48ac", "secondary-fixed-dim": "#b4c1ff", "primary-fixed-dim": "#5191ff", "on-error-container": "#570008", "on-tertiary": "#cfffcd", "error": "#b31b25", "on-primary-container": "#00214f", "tertiary": "#006a26", "background": "#f6f6fb", "on-background": "#2d2f33", "outline": "#75777b", "secondary": "#3853b7", "on-error": "#ffefee", "inverse-surface": "#0c0e12", "surface-container-low": "#f0f0f6", "surface-tint": "#0058bb", "on-tertiary-container": "#005d21", "inverse-on-surface": "#9c9da1", "tertiary-dim": "#005d21", "on-tertiary-fixed": "#004818", "secondary-fixed": "#c6cfff", "on-primary-fixed": "#000000", "surface-container-highest": "#dbdde3", "secondary-dim": "#2b47ab", "surface": "#f6f6fb", "primary-dim": "#004ca4", "tertiary-container": "#6ffb85", "inverse-primary": "#4b8eff", "surface-container-lowest": "#ffffff", "primary": "#0058bb", "surface-container-high": "#e1e2e8", "surface-container": "#e7e8ee", "primary-container": "#6c9fff", "on-secondary": "#f2f1ff", "primary-fixed": "#6c9fff", "secondary-container": "#c6cfff", "on-surface-variant": "#5a5b60", "on-secondary-fixed": "#00288d", "tertiary-fixed": "#6ffb85", "outline-variant": "#acadb1", "surface-bright": "#f6f6fb", "surface-dim": "#d2d4db", "error-container": "#fb5151", "on-primary": "#f0f2ff", "tertiary-fixed-dim": "#60ec79"
      },
      fontFamily: { "headline": ["Inter"], "body": ["Inter"], "label": ["Inter"], "Inter": ["Inter"] },
    },
  },
  plugins: [],
}

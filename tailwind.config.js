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
        claude: {
          bg: {
            light: "#FAF8F5",
            dark: "#1B1917",
            sidebar: "#141311",
            panel: "#22201D",
            card: "#2A2724",
          },
          border: {
            light: "#E7E2D7",
            dark: "#383531",
          },
          text: {
            primary: "#F3EFE6",
            secondary: "#A8A298",
            muted: "#736F68",
          },
          accent: {
            DEFAULT: "#D97706",
            terracotta: "#CC785C",
            hover: "#B85D3F",
            glow: "rgba(204, 120, 92, 0.15)",
          },
          code: {
            bg: "#161513",
            header: "#1E1C1A",
          }
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        card: "#111827",
        surface: "#1f2937",
        "surface-hover": "#374151",

        border: "#2d3748",
        "border-strong": "#4b5563",

        accent: "#7c5cff",
        "accent-2": "#8b5cf6",

        text: {
          DEFAULT: "#f9fafb",
          dim: "#9ca3af",
          faint: "#6b7280",
        },
      },

      backgroundImage: {
        "accent-gradient":
          "linear-gradient(135deg,#7c5cff,#8b5cf6)",
        "login-glow":
          "radial-gradient(circle at top,#7c5cff55,transparent 70%)",
      },
    },
  },
  plugins: [],
};
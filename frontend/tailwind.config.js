/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#06060a",
          900: "#0a0b12",
          850: "#0d0e16",
          800: "#11131d",
          700: "#181b27",
          600: "#22263a",
        },
        gold: {
          300: "#ead6a8",
          400: "#dcc088",
          500: "#c9a76b",
          600: "#a98a4f",
        },
        cream: "#f4eee0",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        widest2: "0.35em",
      },
      boxShadow: {
        glow: "0 0 40px rgba(201,167,107,0.18)",
        panel: "0 10px 40px -10px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "gold-fade": "linear-gradient(135deg,#e8d5a6 0%,#c9a76b 40%,#8a6d3f 100%)",
      },
    },
  },
  plugins: [],
};

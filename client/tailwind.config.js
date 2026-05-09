export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        space: {
          950: "#080b12",
          900: "#0d111c",
          850: "#111827",
          800: "#171f2e",
          700: "#253044",
          cyan: "#4dd6d6",
          lime: "#b5f36d",
          rose: "#ff6b9a"
        }
      }
    }
  },
  plugins: []
};

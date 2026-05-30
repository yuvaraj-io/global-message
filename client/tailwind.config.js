export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        wa: {
          bg: "#F5F5F5",
          chatBg: "#F5F5F5",
          panel: "#FFFFFF",
          panel2: "#EBEBEB",
          border: "#E0E0E0",
          divider: "#E0E0E0",
          header: "#F5F5F5",
          sidebar: "#FFFFFF",
          bubbleOut: "#E8E8E8",
          bubbleIn: "#FFFFFF",
          green: "#0A0A0A",
          greenDark: "#1A1A1A",
          greenAccent: "#0A0A0A",
          blueTick: "#0A0A0A",
          text: "#0A0A0A",
          subtext: "#555555",
          muted: "#888888",
          unread: "#0A0A0A",
          danger: "#FF4757"
        }
      },
      boxShadow: {
        bubble: "0 1px 0.5px rgba(0, 0, 0, 0.08)",
        card: "0 1px 3px rgba(0, 0, 0, 0.06)"
      }
    }
  },
  plugins: []
};

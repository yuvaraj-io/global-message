export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        wa: {
          bg: "#efeae2",
          chatBg: "#f0f2f5",
          panel: "#ffffff",
          border: "#e9edef",
          divider: "#e9edef",
          header: "#f0f2f5",
          sidebar: "#ffffff",
          bubbleOut: "#d9fdd3",
          bubbleIn: "#ffffff",
          green: "#00a884",
          greenDark: "#008069",
          greenAccent: "#25d366",
          blueTick: "#53bdeb",
          text: "#111b21",
          subtext: "#667781",
          muted: "#8696a0",
          unread: "#25d366"
        }
      },
      boxShadow: {
        bubble: "0 1px 0.5px rgba(11, 20, 26, 0.13)",
        card: "0 1px 3px rgba(11, 20, 26, 0.08)"
      }
    }
  },
  plugins: []
};

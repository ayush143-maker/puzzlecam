import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0b0b",
        panel: "#111110",
        paper: "#e8e6df",
        line: "#26241f",
        signal: "#f5c518",
        ok: "#3ecf7a",
        bad: "#ff4d3d",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

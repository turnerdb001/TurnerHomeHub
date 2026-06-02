import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        danger: "hsl(var(--danger))",
        muted: "hsl(var(--muted))",
      },
      boxShadow: {
        grid: "0 0 0 1px hsl(var(--border)), 0 0 32px hsl(var(--primary) / 0.16)",
        pulse: "0 0 26px hsl(var(--primary) / 0.32)",
      },
      backgroundImage: {
        "grid-field":
          "linear-gradient(hsl(var(--primary) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;

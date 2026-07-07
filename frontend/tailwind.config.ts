import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#0F2C4C",
        accent: "#FFC107",
        secondary: "#00A651",
        alert: "#E63946",
        offwhite: "#F7F9FB",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium, minimal brand palette.
        ink: "#0b0d12",
        accent: "#2563eb",
      },
    },
  },
  plugins: [],
};

export default config;

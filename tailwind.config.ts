import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          25: '#f0f7ff',
          50: '#e0efff',
          100: '#b8d9ff',
          200: '#8cc5ff',
          300: '#5aa9ff',
          400: '#2d8fff',
          500: '#0077f7',
          600: '#0056d6',
          700: '#003eb3',
          800: '#002b8f',
          900: '#001a66',
          950: '#000d33',
        },
        slate: {
          25: '#fafbfc',
          50: '#f5f7fa',
          100: '#e8ecf1',
          200: '#d3dae3',
          300: '#b5c2d3',
          400: '#94a6bc',
          500: '#73849a',
          600: '#5a6b82',
          700: '#455366',
          800: '#364251',
          900: '#283141',
          950: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};
export default config;

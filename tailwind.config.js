/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        cairo: ["var(--font-cairo)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        outfit: ["var(--font-outfit)", "sans-serif"],
        handwriting: ["var(--font-handwriting)", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "var(--primary, #fead1d)",
          foreground: "var(--primary-foreground, #ffffff)",
        },
        secondary: {
          DEFAULT: "var(--secondary, #b14288)",
          foreground: "var(--secondary-foreground, #ffffff)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "var(--accent, #F7C948)",
          foreground: "var(--accent-foreground, #000000)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Dynamic colors via CSS variables (for SaaS theming)
        'dynamic-primary': 'var(--color-primary, #fead1d)',
        'dynamic-secondary': 'var(--color-secondary, #b14288)',
        'dynamic-accent': 'var(--color-accent, #F7C948)',
        'dynamic-bg': 'var(--color-background, #170F2C)',
        'dynamic-surface': 'var(--color-surface, #1e1e3f)',
        'dynamic-text': 'var(--color-text, #ffffff)',
        'dynamic-text-muted': 'var(--color-text-muted, #a0aec0)',
        orange: {
          DEFAULT: "#fead1d",
          50: "#fffcf5",
          100: "#fff6db",
          200: "#fee6b3",
          300: "#fdd580",
          400: "#fcc04d",
          500: "#fead1d",
          600: "#e58e0a",
          700: "#b86709",
          800: "#96510f",
          900: "#7c4312",
        },
        purple: {
          DEFAULT: "#b14288",
          50: "#fbf5f9",
          100: "#f6eaf2",
          200: "#edcee3",
          300: "#e0aaca",
          400: "#d07cad",
          500: "#b14288",
          600: "#962d6e",
          700: "#7b2258",
          800: "#661f4b",
          900: "#551d40",
        },
        navy: {
          DEFAULT: "var(--background-hex, #0a0a0c)",
          50: "#f3f2f6",
          100: "#e4e2eb",
          200: "#ccc8da",
          300: "#aa9fc2",
          400: "#8776a5",
          500: "#685689",
          600: "#534270",
          700: "#44355b",
          800: "var(--surface, #121215)",
          900: "var(--background-hex, #0a0a0c)", // Main Dark Bg
          950: "#020202",
        },
      },
    },
  },
  plugins: [],
};

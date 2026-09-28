/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--on-primary) / <alpha-value>)",
          container: "hsl(var(--primary-container) / <alpha-value>)",
          "on-container": "hsl(var(--on-primary-container) / <alpha-value>)",
          fixed: "hsl(var(--primary-fixed) / <alpha-value>)",
          "on-fixed": "hsl(var(--on-primary-fixed) / <alpha-value>)",
          "fixed-dim": "hsl(var(--primary-fixed-dim) / <alpha-value>)",
          "on-fixed-variant": "hsl(var(--on-primary-fixed-variant) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--on-secondary) / <alpha-value>)",
          container: "hsl(var(--secondary-container) / <alpha-value>)",
          "on-container": "hsl(var(--on-secondary-container) / <alpha-value>)",
          fixed: "hsl(var(--secondary-fixed) / <alpha-value>)",
          "on-fixed": "hsl(var(--on-secondary-fixed) / <alpha-value>)",
          "fixed-dim": "hsl(var(--secondary-fixed-dim) / <alpha-value>)",
          "on-fixed-variant": "hsl(var(--on-secondary-fixed-variant) / <alpha-value>)",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary) / <alpha-value>)",
          foreground: "hsl(var(--on-tertiary) / <alpha-value>)",
          container: "hsl(var(--tertiary-container) / <alpha-value>)",
          "on-container": "hsl(var(--on-tertiary-container) / <alpha-value>)",
          fixed: "hsl(var(--tertiary-fixed) / <alpha-value>)",
          "on-fixed": "hsl(var(--on-tertiary-fixed) / <alpha-value>)",
          "fixed-dim": "hsl(var(--tertiary-fixed-dim) / <alpha-value>)",
          "on-fixed-variant": "hsl(var(--on-tertiary-fixed-variant) / <alpha-value>)",
        },
        error: {
          DEFAULT: "hsl(var(--error) / <alpha-value>)",
          foreground: "hsl(var(--on-error) / <alpha-value>)",
          container: "hsl(var(--error-container) / <alpha-value>)",
          "on-container": "hsl(var(--on-error-container) / <alpha-value>)",
        },
        background: "hsl(var(--background) / <alpha-value>)",
        "on-background": "hsl(var(--on-background) / <alpha-value>)",
        "on-primary": "hsl(var(--on-primary) / <alpha-value>)",
        "on-primary-container": "hsl(var(--on-primary-container) / <alpha-value>)",
        "on-primary-fixed": "hsl(var(--on-primary-fixed) / <alpha-value>)",
        "on-primary-fixed-variant": "hsl(var(--on-primary-fixed-variant) / <alpha-value>)",
        "on-secondary": "hsl(var(--on-secondary) / <alpha-value>)",
        "on-secondary-container": "hsl(var(--on-secondary-container) / <alpha-value>)",
        "on-secondary-fixed": "hsl(var(--on-secondary-fixed) / <alpha-value>)",
        "on-secondary-fixed-variant": "hsl(var(--on-secondary-fixed-variant) / <alpha-value>)",
        "on-tertiary": "hsl(var(--on-tertiary) / <alpha-value>)",
        "on-tertiary-container": "hsl(var(--on-tertiary-container) / <alpha-value>)",
        "on-tertiary-fixed": "hsl(var(--on-tertiary-fixed) / <alpha-value>)",
        "on-tertiary-fixed-variant": "hsl(var(--on-tertiary-fixed-variant) / <alpha-value>)",
        "on-error": "hsl(var(--on-error) / <alpha-value>)",
        "on-error-container": "hsl(var(--on-error-container) / <alpha-value>)",
        "surface-fixed": "hsl(var(--surface-fixed, var(--surface)) / <alpha-value>)",
        "primary-fixed": "hsl(var(--primary-fixed) / <alpha-value>)",
        "primary-fixed-dim": "hsl(var(--primary-fixed-dim) / <alpha-value>)",
        "secondary-fixed": "hsl(var(--secondary-fixed) / <alpha-value>)",
        "secondary-fixed-dim": "hsl(var(--secondary-fixed-dim) / <alpha-value>)",
        "tertiary-fixed": "hsl(var(--tertiary-fixed) / <alpha-value>)",
        "tertiary-fixed-dim": "hsl(var(--tertiary-fixed-dim) / <alpha-value>)",
        surface: {
          DEFAULT: "hsl(var(--surface) / <alpha-value>)",
          on: "hsl(var(--on-surface) / <alpha-value>)",
          dim: "hsl(var(--surface-dim) / <alpha-value>)",
          bright: "hsl(var(--surface-bright) / <alpha-value>)",
          "container-lowest": "hsl(var(--surface-container-lowest) / <alpha-value>)",
          "container-low": "hsl(var(--surface-container-low) / <alpha-value>)",
          container: "hsl(var(--surface-container) / <alpha-value>)",
          "container-high": "hsl(var(--surface-container-high) / <alpha-value>)",
          "container-highest": "hsl(var(--surface-container-highest) / <alpha-value>)",
          variant: "hsl(var(--surface-variant) / <alpha-value>)",
          tint: "hsl(var(--surface-tint) / <alpha-value>)",
        },
        "on-surface": "hsl(var(--on-surface) / <alpha-value>)",
        "on-surface-variant": "hsl(var(--on-surface-variant) / <alpha-value>)",
        outline: {
          DEFAULT: "hsl(var(--outline) / <alpha-value>)",
          variant: "hsl(var(--outline-variant) / <alpha-value>)",
        },
        "inverse-surface": "hsl(var(--inverse-surface) / <alpha-value>)",
        "inverse-on-surface": "hsl(var(--inverse-on-surface) / <alpha-value>)",
        "inverse-primary": "hsl(var(--inverse-primary) / <alpha-value>)",

        /* shadcn-compatible aliases */
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
        "secondary-foreground": "hsl(var(--secondary-foreground) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",

        /* Neutrals are driven by CSS variables so `.dark` on <html> flips the
           whole palette without touching component markup. Channel triplets
           keep `<alpha-value>` opacity modifiers (bg-black/80) working. */
        white: "rgb(var(--c-white) / <alpha-value>)",
        black: "rgb(var(--c-black) / <alpha-value>)",
        zinc: {
          50: "rgb(var(--z-50) / <alpha-value>)",
          100: "rgb(var(--z-100) / <alpha-value>)",
          200: "rgb(var(--z-200) / <alpha-value>)",
          300: "rgb(var(--z-300) / <alpha-value>)",
          400: "rgb(var(--z-400) / <alpha-value>)",
          500: "rgb(var(--z-500) / <alpha-value>)",
          600: "rgb(var(--z-600) / <alpha-value>)",
          700: "rgb(var(--z-700) / <alpha-value>)",
          800: "rgb(var(--z-800) / <alpha-value>)",
          900: "rgb(var(--z-900) / <alpha-value>)",
          950: "rgb(var(--z-950) / <alpha-value>)",
        },
      },

      fontFamily: {
        // Reference roles
        brand: ["Gruppo", "sans-serif"],
        heading: ["Gruppo", "sans-serif"],
        body: ["Nunito", "sans-serif"],
        code: ["'Fira Code'", "monospace"],
        mono: ["'Source Code Pro'", "monospace"],
        // Semantic aliases kept so existing markup keeps working
        sans: ["Nunito", "sans-serif"],
        serif: ["Nunito", "sans-serif"],
        "code-alt": ["Source Code Pro", "monospace"],
        display: ["Gruppo", "sans-serif"],
        "headline-xl": ["Gruppo", "sans-serif"],
        "headline-lg": ["Gruppo", "sans-serif"],
        "headline-lg-mobile": ["Gruppo", "sans-serif"],
        "headline-md": ["Gruppo", "sans-serif"],
        "headline-sm": ["Gruppo", "sans-serif"],
        "headline-xl-mobile": ["Gruppo", "sans-serif"],
        "body-lg": ["Nunito", "sans-serif"],
        "body-md": ["Nunito", "sans-serif"],
        "body-sm": ["Nunito", "sans-serif"],
        "label-lg": ["Nunito", "sans-serif"],
        "label-md": ["Nunito", "sans-serif"],
        "label-sm": ["Nunito", "sans-serif"],
      },

      // Semantic sizes mapped onto the reference's proportions
      // (xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30)
      fontSize: {
        "headline-xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "0.01em" }],
        "headline-lg": ["1.5rem", { lineHeight: "2rem", letterSpacing: "0.01em" }],
        "headline-lg-mobile": ["1.25rem", { lineHeight: "1.75rem" }],
        "headline-md": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "0.01em" }],
        "headline-sm": ["1.125rem", { lineHeight: "1.5rem" }],
        "headline-xl-mobile": ["1.5rem", { lineHeight: "2rem" }],

        "body-lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "body-md": ["1rem", { lineHeight: "1.625rem" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],

        "label-lg": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "700" }],
        "label-md": ["0.75rem", { lineHeight: "1rem" }],
        "label-sm": ["0.6875rem", { lineHeight: "1rem" }],
        "label-xs": ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.08em" }],
      },

      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        md: "1rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
        gutter: "1.5rem",
        margin: "2rem",
      },

      borderRadius: {
        // reference uses rounded-lg (8px) for controls, rounded-xl (12px) for cards
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },

      boxShadow: {
        // alias so legacy shadow-elev usage matches the reference's shadow-sm
        elev: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "elev-hover": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "elev-lg": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

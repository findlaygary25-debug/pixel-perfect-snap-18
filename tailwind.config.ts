import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        button: "var(--button-radius)",
        loop: "var(--loop-radius)",
      },
      spacing: {
        'navbar': 'var(--navbar-height)',
        'side': 'var(--side-width)',
        'side-folded': 'var(--side-folded-width)',
        'sidebar': 'var(--sidebar-width)',
        'x-gap': 'var(--x-gap)',
        'y-gap': 'var(--y-gap)',
        'header-x-gap': 'var(--header-x-gap)',
        'header-y-gap': 'var(--header-y-gap)',
        'loop-gap': 'var(--loop-grid-gap)',
      },
      width: {
        'content': 'var(--content-width)',
        'sidebar': 'var(--sidebar-width)',
        'header-image': 'var(--header-image-size)',
      },
      height: {
        'navbar': 'var(--navbar-height)',
        'header-image': 'var(--header-image-size)',
        'side-icon': 'var(--side-icon-height)',
      },
      minWidth: {
        'loop': 'var(--loop-min-width)',
      },
      gap: {
        'loop': 'var(--loop-grid-gap)',
        'loop-header': 'var(--loop-header-gap)',
        'x': 'var(--x-gap)',
        'y': 'var(--y-gap)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slideIn": {
          from: {
            transform: "translateX(-100%)",
          },
          to: {
            transform: "translateX(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slideIn": "slideIn 0.3s ease",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  content: [
    "index.html",
    "src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        title: "Spectral SC",
      }
    },
  },
  daisyui: {
    themes: [
      {
        default: {
          "primary": "#822000",
          "secondary": "#e6e6e6",
          "error": "#de1d41",
          "accent": "#822000",
          "neutral": "#F2EFE4",
          "base-100": "#ffffff",
          "--rounded-box": "0",
          "--rounded-btn": "0",
        },
        dark: {
          "primary": "#822000",
          "secondary": "#e6e6e6",
          "error": "#de1d41",
          "accent": "#822000",
          "neutral": "#1c1917",
          "base-100": "#292524",
          "--rounded-box": "0",
          "--rounded-btn": "0",
        },

      },
    ],
  },
  plugins: [daisyui],
} satisfies Config


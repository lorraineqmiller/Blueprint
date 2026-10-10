/** @type {import('tailwindcss').Config} */
// Blueprint brand kit: "Every blue has a job."
//   Blueprint #155B84 — primary actions, active nav, selected states
//   Denim     #526F9E — focus rings, links, votes, social actions
//   Archive   #537FA5 — secondary actions, supporting icons, metadata
//   Powder    #ADC8D2 — friend activity, selected cards, info surfaces
//   Mist      #D9E5E2 — app backgrounds, dividers, disabled surfaces
//   Ink #17191F · Paper #F3F0E9
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17191f',
        paper: '#f3f0e9',
        surface: '#ebe7de',
        blueprint: '#155b84',
        denim: '#526f9e',
        archive: '#537fa5',
        powder: '#adc8d2',
        mist: '#d9e5e2',
        navy: {
          DEFAULT: '#155b84',
          soft: '#1d6a96',
        },
        accent: {
          100: '#e8f0f1',
          200: '#d9e5e2',
          300: '#adc8d2',
          400: '#8eaec4',
          500: '#537fa5',
          600: '#155b84',
          700: '#124e72',
          800: '#0f3f5c',
          900: '#0b2f45',
        },
        neutral: {
          100: '#f7f5f0',
          200: '#ebe7de',
          300: '#dcd8ce',
          400: '#c4c0b6',
          500: '#9c998f',
          600: '#76746c',
          700: '#5a5952',
          800: '#3d3d39',
          900: '#26272a',
        },
      },
      fontFamily: {
        heading: ['"Bodoni Moda"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
        script: ['Italianno', 'cursive'],
        hand: ['"Oooh Baby"', 'cursive'],
      },
    },
  },
  plugins: [],
}

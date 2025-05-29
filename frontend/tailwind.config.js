/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3d1b3",
        secondary: "#fcfdc",
        accent1: "#31aef8",
        accent2: "#a6d0f4",
        accent3: "#7bd3f0",
        success: "#10B981",
        danger: "#EF4444",
        neutral: "#6B7280",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


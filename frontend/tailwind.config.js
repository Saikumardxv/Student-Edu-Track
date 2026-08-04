/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
   theme: {
      extend: {
       colors: {
         primary: "#2563EB",
         secondary: "#1E293B",
         background: "#0F172A",
         card: "#1F2937",
         success: "#22C55E",
         warning: "#F59E0B",
         danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  plugins: [],
}

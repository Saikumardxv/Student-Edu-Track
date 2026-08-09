import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Use root path in development/Vercel and GitHub Pages base path in production
  base: (process.env.NODE_ENV === 'production' && !process.env.VERCEL) ? '/Student-Edutrack/' : '/',

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
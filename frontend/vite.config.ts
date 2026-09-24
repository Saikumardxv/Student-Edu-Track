import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "");

  return {
    plugins: [react()],
    envDir: "..",

    // Use root path in development/Vercel and GitHub Pages base path in production
    base: (mode === 'production' && !process.env.VERCEL) ? '/Student-Edutrack/' : '/',

    server: {
      host: env.VITE_HOST || "localhost",
      port: Number(env.VITE_PORT || 5173),
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:5000",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.VITE_BACKEND_URL || "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
  };
});
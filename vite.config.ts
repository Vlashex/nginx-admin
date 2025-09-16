import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Use base only for production build (GitHub Pages). Dev uses "/" so tests work.
  base: mode === "production" ? "/nginx-admin/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/processes": path.resolve(__dirname, "./src/processes"),
    },
  },
}));

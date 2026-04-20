import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    pure: ['console.debug', 'console.info', 'console.warn', 'console.log'],
  },
  preview: {
    allowedHosts: [
      'codeawakens.online',
      'www.codeawakens.online'
    ],
    host: true,
    port: 5173,
  },
})

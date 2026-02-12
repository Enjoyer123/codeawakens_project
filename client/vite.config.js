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
    // ❌ ลบอันเก่าออก (drop: ['console'])
    // ✅ ใส่อันนี้แทน: บอกให้ลบเฉพาะ log, debug, info แต่เหลือ error ไว้
    // pure: [ 'console.debug', 'console.info', 'console.warn'],
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

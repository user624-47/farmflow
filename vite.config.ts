import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Fix for Vercel deployment
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    rollupOptions: {
      external: ['@rollup/rollup-linux-x64-gnu'],
    },
    target: 'es2020',
  },
  server: {
    host: "localhost",
    port: 8080,
    strictPort: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
    allowedHosts: [
      'f3c9013fcef8.ngrok-free.app',
      'localhost',
    ]
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

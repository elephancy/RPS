import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',   // force IPv4 loopback
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
    hmr: { host: '127.0.0.1', port: 5173 }
  },
  build: { outDir: 'build' }
});

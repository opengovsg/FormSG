import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
  return {
    build: {
      outDir: '../dist/frontend',
      emptyOutDir: true,
      rollupOptions: {
        external: ['jszip'],
      },
    },
    base: './',
    server: {
      proxy: {
        '/api/v3': 'http://localhost:5001',
      },
    },
    plugins: [
      tsconfigPaths(),
      nodePolyfills({
        include: ['stream', 'util'],
      }),
      react(),
      svgr({ svgrOptions: { icon: true } }),
    ],
    worker: {
      plugins: () => [tsconfigPaths()],
    },
  }
})

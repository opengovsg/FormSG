import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
// @ts-expect-error missing type definitions
import nodePolyfills from 'vite-plugin-node-stdlib-browser'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
  return {
    build: {
      outDir: '../dist/frontend',
      emptyOutDir: true,
    },
    base: './',
    server: {
      proxy: {
        '/api/v3': 'http://localhost:5001',
      },
    },
    plugins: [
      tsconfigPaths(),
      nodePolyfills(),
      react(),
      svgr({ svgrOptions: { icon: true } }),
    ],
    worker: {
      plugins: () => [tsconfigPaths()],
      format: 'es' as const,
    },
  }
})

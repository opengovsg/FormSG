import react from '@vitejs/plugin-react'
import { BuildOptions, defineConfig } from 'vite'
// @ts-expect-error missing type definitions
import nodePolyfills from 'vite-plugin-node-stdlib-browser'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

const baseRollupOptions = {
  // Silence Rollup "use client" warnings
  // Adapted from https://github.com/vitejs/vite-plugin-react/pull/144
  onwarn(warning, defaultHandler) {
    if (
      warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
      warning.message.includes('use client')
    ) {
      return
    }
    defaultHandler(warning)
  },
} satisfies BuildOptions['rollupOptions']

export default defineConfig(() => {
  return {
    build: {
      outDir: '../dist/frontend',
      emptyOutDir: true,
      rollupOptions: {
        ...baseRollupOptions,
        output: {
          // Manually chunk datadog-chunk.ts so it gets preloaded in index.html instead of app.
          manualChunks: {
            'datadog-chunk': ['datadog-chunk.ts'],
          },
        },
        logLevel: 'silent' as const,
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
      nodePolyfills(),
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          // Allows resizing of SVGs to keep aspect ratio with just one dimension
          dimensions: false,
        },
      }),
    ],
    worker: {
      plugins: () => [tsconfigPaths()],
      format: 'es' as const,
    },
  }
})

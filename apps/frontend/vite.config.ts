import react from '@vitejs/plugin-react'
import { BuildOptions, defineConfig, PluginOption } from 'vite'
// @ts-expect-error missing type definitions
import nodePolyfills from 'vite-plugin-node-stdlib-browser'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Replaces @VITE_APP_* placeholders in source with their corresponding
 * environment variable values at build time. This is used for values that
 * must be baked into the JS bundle (e.g. Datadog applicationId, clientToken).
 */
function replaceEnvPlaceholders(): PluginOption {
  const replacements: Record<string, string> = {
    '@VITE_APP_DD_RUM_APP_ID': process.env.VITE_APP_DD_RUM_APP_ID ?? '',
    '@VITE_APP_DD_RUM_CLIENT_TOKEN':
      process.env.VITE_APP_DD_RUM_CLIENT_TOKEN ?? '',
    '@VITE_APP_VERSION': process.env.VITE_APP_VERSION ?? '',
  }

  return {
    name: 'replace-env-placeholders',
    transform(code) {
      let result = code
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replaceAll(key, value)
      }
      return result !== code ? result : null
    },
  }
}

const baseRollupOptions = {
  // Silence Rollup "use client" warnings
  // Adapted from https://github.com/vitejs/vite-plugin-react/pull/144
  onLog(log, defaultHandler) {
    return
  },

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
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        ...baseRollupOptions,
        output: {
          // Manually chunk datadog-chunk.ts so it gets preloaded in index.html instead of app.
          manualChunks: {
            'datadog-chunk': ['datadog-chunk.ts'],
          },
        },
        // logLevel: 'silent' as const,
      },
    },
    base: './',
    server: {
      allowedHosts: ['.ngrok-free.dev'],
      proxy: {
        '/api/v3': 'http://127.0.0.1:5001',
      },
    },
    plugins: [
      replaceEnvPlaceholders(),
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

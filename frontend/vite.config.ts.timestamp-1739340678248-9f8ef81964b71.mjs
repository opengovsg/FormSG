// vite.config.ts
import react from "file:///Users/hengscott/repos/FormSG/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/hengscott/repos/FormSG/frontend/node_modules/vite/dist/node/index.js";
import nodePolyfills from "file:///Users/hengscott/repos/FormSG/frontend/node_modules/vite-plugin-node-stdlib-browser/index.cjs";
import svgr from "file:///Users/hengscott/repos/FormSG/frontend/node_modules/vite-plugin-svgr/dist/index.js";
import tsconfigPaths from "file:///Users/hengscott/repos/FormSG/frontend/node_modules/vite-tsconfig-paths/dist/index.mjs";
var baseRollupOptions = {
  // Silence Rollup "use client" warnings
  // Adapted from https://github.com/vitejs/vite-plugin-react/pull/144
  onLog(log, defaultHandler) {
    return;
  },
  onwarn(warning, defaultHandler) {
    if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("use client")) {
      return;
    }
    defaultHandler(warning);
  }
};
var vite_config_default = defineConfig(() => {
  return {
    build: {
      outDir: "../dist/frontend",
      emptyOutDir: true,
      rollupOptions: {
        ...baseRollupOptions,
        output: {
          // Manually chunk datadog-chunk.ts so it gets preloaded in index.html instead of app.
          manualChunks: {
            "datadog-chunk": ["datadog-chunk.ts"]
          }
        }
        // logLevel: 'silent' as const,
      }
    },
    base: "./",
    server: {
      proxy: {
        "/api/v3": "http://localhost:5001"
      }
    },
    plugins: [
      tsconfigPaths(),
      nodePolyfills(),
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          // Allows resizing of SVGs to keep aspect ratio with just one dimension
          dimensions: false
        }
      })
    ],
    worker: {
      plugins: () => [tsconfigPaths()],
      format: "es"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvaGVuZ3Njb3R0L3JlcG9zL0Zvcm1TRy9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2hlbmdzY290dC9yZXBvcy9Gb3JtU0cvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2hlbmdzY290dC9yZXBvcy9Gb3JtU0cvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgeyBCdWlsZE9wdGlvbnMsIGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG4vLyBAdHMtZXhwZWN0LWVycm9yIG1pc3NpbmcgdHlwZSBkZWZpbml0aW9uc1xuaW1wb3J0IG5vZGVQb2x5ZmlsbHMgZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1zdGRsaWItYnJvd3NlcidcbmltcG9ydCBzdmdyIGZyb20gJ3ZpdGUtcGx1Z2luLXN2Z3InXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tICd2aXRlLXRzY29uZmlnLXBhdGhzJ1xuXG5jb25zdCBiYXNlUm9sbHVwT3B0aW9ucyA9IHtcbiAgLy8gU2lsZW5jZSBSb2xsdXAgXCJ1c2UgY2xpZW50XCIgd2FybmluZ3NcbiAgLy8gQWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS92aXRlanMvdml0ZS1wbHVnaW4tcmVhY3QvcHVsbC8xNDRcbiAgb25Mb2cobG9nLCBkZWZhdWx0SGFuZGxlcikge1xuICAgIHJldHVyblxuICB9LFxuXG4gIG9ud2Fybih3YXJuaW5nLCBkZWZhdWx0SGFuZGxlcikge1xuICAgIGlmIChcbiAgICAgIHdhcm5pbmcuY29kZSA9PT0gJ01PRFVMRV9MRVZFTF9ESVJFQ1RJVkUnICYmXG4gICAgICB3YXJuaW5nLm1lc3NhZ2UuaW5jbHVkZXMoJ3VzZSBjbGllbnQnKVxuICAgICkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGRlZmF1bHRIYW5kbGVyKHdhcm5pbmcpXG4gIH0sXG59IHNhdGlzZmllcyBCdWlsZE9wdGlvbnNbJ3JvbGx1cE9wdGlvbnMnXVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIGJ1aWxkOiB7XG4gICAgICBvdXREaXI6ICcuLi9kaXN0L2Zyb250ZW5kJyxcbiAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAuLi5iYXNlUm9sbHVwT3B0aW9ucyxcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgLy8gTWFudWFsbHkgY2h1bmsgZGF0YWRvZy1jaHVuay50cyBzbyBpdCBnZXRzIHByZWxvYWRlZCBpbiBpbmRleC5odG1sIGluc3RlYWQgb2YgYXBwLlxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgJ2RhdGFkb2ctY2h1bmsnOiBbJ2RhdGFkb2ctY2h1bmsudHMnXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAvLyBsb2dMZXZlbDogJ3NpbGVudCcgYXMgY29uc3QsXG4gICAgICB9LFxuICAgIH0sXG4gICAgYmFzZTogJy4vJyxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvYXBpL3YzJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMScsXG4gICAgICB9LFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgdHNjb25maWdQYXRocygpLFxuICAgICAgbm9kZVBvbHlmaWxscygpLFxuICAgICAgcmVhY3QoKSxcbiAgICAgIHN2Z3Ioe1xuICAgICAgICBzdmdyT3B0aW9uczoge1xuICAgICAgICAgIGljb246IHRydWUsXG4gICAgICAgICAgLy8gQWxsb3dzIHJlc2l6aW5nIG9mIFNWR3MgdG8ga2VlcCBhc3BlY3QgcmF0aW8gd2l0aCBqdXN0IG9uZSBkaW1lbnNpb25cbiAgICAgICAgICBkaW1lbnNpb25zOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF0sXG4gICAgd29ya2VyOiB7XG4gICAgICBwbHVnaW5zOiAoKSA9PiBbdHNjb25maWdQYXRocygpXSxcbiAgICAgIGZvcm1hdDogJ2VzJyBhcyBjb25zdCxcbiAgICB9LFxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvUyxPQUFPLFdBQVc7QUFDdFQsU0FBdUIsb0JBQW9CO0FBRTNDLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sVUFBVTtBQUNqQixPQUFPLG1CQUFtQjtBQUUxQixJQUFNLG9CQUFvQjtBQUFBO0FBQUE7QUFBQSxFQUd4QixNQUFNLEtBQUssZ0JBQWdCO0FBQ3pCO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBTyxTQUFTLGdCQUFnQjtBQUM5QixRQUNFLFFBQVEsU0FBUyw0QkFDakIsUUFBUSxRQUFRLFNBQVMsWUFBWSxHQUNyQztBQUNBO0FBQUEsSUFDRjtBQUNBLG1CQUFlLE9BQU87QUFBQSxFQUN4QjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhLE1BQU07QUFDaEMsU0FBTztBQUFBLElBQ0wsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsYUFBYTtBQUFBLE1BQ2IsZUFBZTtBQUFBLFFBQ2IsR0FBRztBQUFBLFFBQ0gsUUFBUTtBQUFBO0FBQUEsVUFFTixjQUFjO0FBQUEsWUFDWixpQkFBaUIsQ0FBQyxrQkFBa0I7QUFBQSxVQUN0QztBQUFBLFFBQ0Y7QUFBQTtBQUFBLE1BRUY7QUFBQSxJQUNGO0FBQUEsSUFDQSxNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTCxXQUFXO0FBQUEsTUFDYjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLGNBQWM7QUFBQSxNQUNkLGNBQWM7QUFBQSxNQUNkLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNILGFBQWE7QUFBQSxVQUNYLE1BQU07QUFBQTtBQUFBLFVBRU4sWUFBWTtBQUFBLFFBQ2Q7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixTQUFTLE1BQU0sQ0FBQyxjQUFjLENBQUM7QUFBQSxNQUMvQixRQUFRO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

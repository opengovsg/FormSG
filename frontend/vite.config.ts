import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
  return {
    build: {
      outDir: '../dist/frontend',
    },
    plugins: [tsconfigPaths(), react(), svgr({ svgrOptions: { icon: true } })],
  }
})

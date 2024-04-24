import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig(() => {
  return {
    build: {
      outDir: '../dist/frontend',
    },
    resolve: {
      // Aliases must be kept in sync with tsconfig.json
      alias: {
        '~shared/*': resolve(__dirname, '../shared/*'),
        '~assets/*': resolve(__dirname, './src/assets/*'),
        '~contexts/*': resolve(__dirname, './src/contexts/*'),
        '~constants/*': resolve(__dirname, './src/constants/*'),
        '~components/*': resolve(__dirname, './src/components/*'),
        '~templates/*': resolve(__dirname, './src/templates/*'),
        '~features/*': resolve(__dirname, './src/features/*'),
        '~hooks/*': resolve(__dirname, './src/hooks/*'),
        '~utils/*': resolve(__dirname, './src/utils/*'),
        '~pages/*': resolve(__dirname, './src/pages/*'),
        '~services/*': resolve(__dirname, './src/services/*'),
        '~theme/*': resolve(__dirname, './src/theme/*'),
        '~typings/*': resolve(__dirname, './src/typings/*'),
        '~/*': resolve(__dirname, './src/*'),
      },
    },
    plugins: [react(), svgr({ svgrOptions: { icon: true } })],
  }
})

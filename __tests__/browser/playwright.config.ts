import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:6006',
    viewport: { width: 700, height: 900 },
  },
  webServer: {
    command: 'pnpm --filter formsg-frontend storybook --ci --no-open',
    url: 'http://localhost:6006/index.json',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})

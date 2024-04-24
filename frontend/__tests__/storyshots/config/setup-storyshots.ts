import { logger } from '@storybook/node-logger'
import fs from 'fs'
import path from 'path'

export const getStorybookUrl = (): string | null => {
  if (import.meta.env.USE_DEV_SERVER) {
    return 'http://localhost:6006'
  }

  const pathToStorybookStatic = path.join(
    __dirname,
    '../../../',
    'storybook-static',
  )

  if (!fs.existsSync(pathToStorybookStatic)) {
    logger.error(
      'You are running puppeteer tests without having the static build of storybook. Please run "npm run test:puppeteer" before running tests.',
    )
    return null
  }
  return `file://${pathToStorybookStatic}`
}

/**
 * This file is not suffixed by ".test.ts" to not being run with all other test
 * files.
 * `npm run test:a11y` generates the static build & uses storyshots-puppeteer.
 * `npm run test:a11y-dev` uses "localhost:6006" as the storybookUrl and
 * requires storybook to be running.
 */
import initStoryshots from '@storybook/addon-storyshots'
import { axeTest } from '@storybook/addon-storyshots-puppeteer'

import { getStorybookUrl } from './config/setup-storyshots'

const storybookUrl = getStorybookUrl()
if (storybookUrl) {
  initStoryshots({
    suite: 'A11y checks',
    test: axeTest({ storybookUrl }),
  })
}

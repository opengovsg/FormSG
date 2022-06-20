/**
 * This file is used to add global decorators and parameters to all storybook stories.
 * @see https://storybook.js.org/docs/react/configure/overview#configure-story-rendering
 */

import 'focus-visible/dist/focus-visible.min.js'
import '../src/assets/fonts/inter.css'

import { initialize, mswDecorator } from 'msw-storybook-addon'

import * as dayjsUtils from '~utils/dayjs'

import i18n from '../src/i18n/i18n'

import { MainDecorator } from './utils/MainDecorator'
import { StorybookTheme } from './themes'

initialize()
dayjsUtils.init()

export const decorators = [MainDecorator, mswDecorator]

export const parameters = {
  i18n,
  locale: 'en-SG',
  locales: {
    'en-SG': 'English',
  },
  docs: {
    theme: StorybookTheme.docs,
    inlineStories: true,
  },
}

import 'inter-ui/inter.css'

import { create } from '@storybook/theming'

export const StorybookTheme = {
  docs: create({
    base: 'light',
    fontBase: `"Inter var", san-serif`,
  }),
}

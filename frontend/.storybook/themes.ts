import { create } from '@storybook/theming'

export const StorybookTheme = {
  manager: create({
    base: 'light',
    brandTitle: 'Form Design System',
    brandUrl: 'https://github.com/opengovsg/formsg',
    // brandImage: ""
  }),
  docs: create({
    base: 'light',
    fontBase: 'Inter, Calibre, Arial, Helvetica, sans-serif',
  }),
}

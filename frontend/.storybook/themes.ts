import 'inter-ui/inter.css'

import { create } from '@storybook/theming'

import PackageInfo from '../package.json'

import brandImage from './assets/img/logo_form_HORT_FULL.png'

export const StorybookTheme = {
  manager: create({
    base: 'light',
    brandTitle: `Form Design System@${PackageInfo.version}`,
    brandUrl: 'https://github.com/opengovsg/formsg',
    brandImage,
    // UI
    appBg: '#f6f7fc', // primary.100,
    appBorderColor: '#DADCE3',
    appBorderRadius: 0,
    // Typography
    fontBase: `"Inter var", san-serif`,
    // Text colours
    textColor: '#445072', // secondary.500,
    textInverseColor: '#445072', // secondary.500,
    colorPrimary: '#4A61C0', // primary.500,
    colorSecondary: '#4A61C0', // primary.500,

    // Toolbar default and active colors
    barTextColor: '#445072', // secondary.500,,
    barSelectedColor: '#4A61C0', // primary.500,
  }),
  docs: create({
    base: 'light',
    fontBase: `"Inter var", san-serif`,
  }),
}

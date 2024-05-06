import { Meta, StoryObj } from '@storybook/react'

import { ColourTable, ColourTableProps } from './ColourTable'

export default {
  title: 'Foundation/Colours',
  component: ColourTable,
} as Meta<ColourTableProps>

type Story = StoryObj<typeof ColourTable>

const createPalette = (
  palette: string,
  shades: string[] = [
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
  ],
) => {
  return shades.map((shade) => ({
    palette,
    shade,
  }))
}

export const BrandPrimary: Story = {
  args: {
    label: 'Brand primary colours',
    colours: createPalette('brand.primary'),
  },
  name: 'Brand/Primary',
}

export const BrandSecondary: Story = {
  args: {
    label: 'Brand secondary colours',
    colours: createPalette('brand.secondary'),
  },
  name: 'Brand/Secondary',
}

export const FormThemeBlue: Story = {
  args: {
    label: 'Form Theme Blue colours',
    colours: createPalette('theme-blue'),
  },
  name: 'Form Theme/Blue',
}

export const FormThemeGreen: Story = {
  args: {
    label: 'Form Theme Green colours',
    colours: createPalette('theme-green'),
  },
  name: 'Form Theme/Green',
}

export const FormThemeTeal: Story = {
  args: {
    label: 'Form Theme Teal colours',
    colours: createPalette('theme-teal'),
  },
  name: 'Form Theme/Teal',
}

export const FormThemePurple: Story = {
  args: {
    label: 'Form Theme Purple colours',
    colours: createPalette('theme-purple'),
  },
  name: 'Form Theme/Purple',
}

export const FormThemeGrey: Story = {
  args: {
    label: 'Form Theme Grey colours',
    colours: createPalette('theme-grey'),
  },
  name: 'Form Theme/Grey',
}

export const FormThemeYellow: Story = {
  args: {
    label: 'Form Theme Yellow colours',
    colours: createPalette('theme-yellow'),
  },
  name: 'Form Theme/Yellow',
}

export const FormThemeOrange: Story = {
  args: {
    label: 'Form Theme Orange colours',
    colours: createPalette('theme-orange'),
  },
  name: 'Form Theme/Orange',
}

export const FormThemeRed: Story = {
  args: {
    label: 'Form Theme Red colours',
    colours: createPalette('theme-red'),
  },
  name: 'Form Theme/Red',
}

export const FormThemeBrown: Story = {
  args: {
    label: 'Form Theme Brown colours',
    colours: createPalette('theme-brown'),
  },
  name: 'Form Theme/Brown',
}

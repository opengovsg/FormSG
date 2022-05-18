import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { Footer, FooterProps } from './Footer'

const DEFAULT_ARGS: FooterProps = {
  appName: 'Form',
  footerLinks: [
    {
      label: 'User guide',
      href: '',
    },
    {
      label: 'Privacy',
      href: '',
    },
    {
      label: 'Terms of use',
      href: '',
    },
    {
      label: 'Report vulnerability',
      href: '',
    },
  ],
}

export default {
  title: 'Components/Footer',
  component: Footer,
  decorators: [],
  parameters: {
    layout: 'fullscreen',
  },
  args: DEFAULT_ARGS,
} as Meta<FooterProps>

const Template: Story<FooterProps> = (args) => <Footer {...args} />
export const Default = Template.bind({})

export const WithTagline = Template.bind({})
WithTagline.args = {
  ...DEFAULT_ARGS,
  tagline: 'Build secure government forms in minutes',
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

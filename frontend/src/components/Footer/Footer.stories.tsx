import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { Footer, FooterProps } from './Footer'

export default {
  title: 'Components/Footer',
  component: Footer,
  decorators: [],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const defaultArgs: FooterProps = {
  appName: 'Form',
  tagline: 'Build secure government forms in minutes',
  footerLinks: [
    {
      label: 'User Guide',
      href: '',
    },
    {
      label: 'Privacy',
      href: '',
    },
    {
      label: 'Terms of Use',
      href: '',
    },
    {
      label: 'Report Vulnerability',
      href: '',
    },
  ],
}

const Template: Story<FooterProps> = (args) => <Footer {...args} />
export const Default = Template.bind({})
Default.args = defaultArgs

export const Mobile = Template.bind({})
Mobile.args = defaultArgs
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Tablet = Template.bind({})
Tablet.args = defaultArgs
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

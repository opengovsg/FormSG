import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { PublicHeader } from './PublicHeader'

export default {
  title: 'Templates/PublicHeader',
  component: PublicHeader,
  decorators: [],
} as Meta

const defaultArgs = {
  publicHeaderLinks: [
    {
      label: 'Products',
      href: '',
    },
    {
      label: 'Help',
      href: 'https://guide.form.gov.sg',
      showOnMobile: true,
    },
  ],
}

const Template: Story = (args) => <PublicHeader {...args} />
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

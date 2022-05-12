import { Button } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { getMobileViewParameters, viewports } from '~utils/storybook'

import { PublicHeader, PublicHeaderProps } from './PublicHeader'

const DEFAULT_ARGS: PublicHeaderProps = {
  ctaButton: (
    <Button variant="solid" colorScheme="primary">
      Log in
    </Button>
  ),
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

export default {
  title: 'Templates/PublicHeader',
  component: PublicHeader,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [],
  args: DEFAULT_ARGS,
} as Meta

const Template: Story = (args) => <PublicHeader {...args} />
export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

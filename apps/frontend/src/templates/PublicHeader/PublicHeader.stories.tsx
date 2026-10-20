import { Button } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { FORM_GUIDE } from '~constants/links'
import { viewportModes } from '~utils/storybook'

import { PublicHeader, PublicHeaderProps } from './PublicHeader'

const DEFAULT_ARGS: PublicHeaderProps = {
  ctaElement: (
    <Button variant="solid" colorScheme="primary">
      Log in
    </Button>
  ),
  publicHeaderLinks: [
    {
      label: 'Help',
      href: FORM_GUIDE,
      showOnMobile: true,
      MobileIcon: BxsHelpCircle,
    },
  ],
}

export default {
  title: 'Templates/PublicHeader',
  component: PublicHeader,
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
  decorators: [],
  args: DEFAULT_ARGS,
} as Meta

const Template: StoryFn<PublicHeaderProps> = (args) => (
  <PublicHeader {...args} />
)
export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('tablet', 'mobile') } }

export const WithoutCTA = Template.bind({})
WithoutCTA.args = {
  ...DEFAULT_ARGS,
  ctaElement: undefined,
}

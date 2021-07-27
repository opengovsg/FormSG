import { HStack, Icon, TooltipProps, VStack } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { Tooltip } from './Tooltip'

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  decorators: [],
} as Meta

const Template: Story<TooltipProps> = (args) => {
  return (
    // padding to create space for tooltips to appear
    <VStack p="350px">
      <Tooltip
        {...args}
        label="Display tooltip content right"
        placement="right"
      />
      <Tooltip
        {...args}
        label="Display tooltip content left"
        placement="left"
      />
      <Tooltip {...args} label="Display tooltip content top" placement="top" />
      <Tooltip
        {...args}
        label="Display tooltip content bottom"
        placement="bottom"
      />
    </VStack>
  )
}
export const TooltipOnHover = Template.bind({})
TooltipOnHover.args = {
  children: <Icon name="Question" />,
}

const SingleToolTip: Story<TooltipProps> = (args) => {
  return (
    <HStack>
      <div>OTP Verification Long Message</div>
      <Tooltip {...args} />
    </HStack>
  )
}

export const MobileExample = SingleToolTip.bind({})
MobileExample.args = {
  label:
    'For developers and IT officers. We will POST encrypted form responses in real-time to the HTTPS endpoint specified here.',
  children: <Icon name="Question" />,
}
MobileExample.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

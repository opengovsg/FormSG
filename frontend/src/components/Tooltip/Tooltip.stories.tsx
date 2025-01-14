import { Box, Icon, Placement, TooltipProps, VStack } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BxsHelpCircle } from '~/assets/icons/BxsHelpCircle'

import { viewports } from '~utils/storybook'

import { Tooltip } from './Tooltip'

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  decorators: [],
} as Meta

const TooltipStack = (
  args: TooltipProps & { labels: { value: string; placement: Placement }[] },
): JSX.Element => {
  return (
    // bottom margin just so that story snapshot does not get cut off at bottom
    <VStack align="left" spacing="4rem" mb="4rem">
      {args.labels.map(({ value, placement }, idx) => (
        <Box key={idx}>
          {value}
          <Tooltip
            {...args}
            label="Tooltip content goes here"
            placement={placement}
          >
            <Icon
              as={BxsHelpCircle}
              aria-hidden
              h="1.25rem"
              ml="0.5rem"
              verticalAlign="sub"
            />
          </Tooltip>
        </Box>
      ))}
    </VStack>
  )
}

const Template: StoryFn<TooltipProps> = (args) => {
  return (
    <TooltipStack
      {...args}
      labels={[
        { value: 'Tooltip on the right', placement: 'right' },
        {
          value: "Left (requires longer text so it doesn't flip right)",
          placement: 'left',
        },
        { value: 'Tooltip on top', placement: 'top' },
        { value: 'Tooltip at bottom', placement: 'bottom' },
      ]}
    />
  )
}
export const TooltipOnHover = Template.bind({})

export const OpenTooltip = Template.bind({})
OpenTooltip.args = {
  isOpen: true,
}

const MobileTemplate: StoryFn<TooltipProps> = (args) => {
  return (
    <TooltipStack
      {...args}
      labels={[
        { value: 'Right', placement: 'right' },
        { value: 'Left (requires longer text)', placement: 'left' },
        { value: 'Top', placement: 'top' },
        { value: 'Bottom', placement: 'bottom' },
        {
          value: 'Placed right but flips left automatically due to space',
          placement: 'right',
        },
        {
          value:
            'Placed left but flips right automatically due to space blah blah blah',
          placement: 'left',
        },
      ]}
    />
  )
}

export const Mobile = MobileTemplate.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

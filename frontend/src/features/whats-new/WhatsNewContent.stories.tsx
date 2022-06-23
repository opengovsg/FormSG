import { Box } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { WhatsNewBlock, WhatsNewBlockProps } from './WhatsNewBlock'

export default {
  title: 'Features/WhatsNew/WhatsNewBlock',
  parameters: {
    chromatic: { pauseAnimationAtEnd: true, delay: 50 },
  },
} as Meta

const Template: Story<WhatsNewBlockProps> = (args) => {
  return (
    <Box width="37.25rem">
      <WhatsNewBlock {...args} />
    </Box>
  )
}

export const Desktop = Template.bind({})
Desktop.args = {
  date: '17 July',
  title: 'Introducing Workspaces',
  description:
    'With the new Phone Number field, you can quickly collect people’s digits. Local and international validation available.',
  imageUrl: '/whats-new/workspaces-feature-update.svg',
}

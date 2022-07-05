import { Box } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import WorkspaceFeatureUpdateImg from './assets/workspaces_feature_update.svg'
import { WhatsNewContent, WhatsNewContentProps } from './WhatsNewContent'

export default {
  title: 'Features/WhatsNew/WhatsNewBlock',
  parameters: {
    chromatic: { pauseAnimationAtEnd: true, delay: 50 },
  },
} as Meta

const Template: Story<WhatsNewContentProps> = (args) => {
  return (
    <Box width="37.25rem">
      <WhatsNewContent {...args} />
    </Box>
  )
}

export const Desktop = Template.bind({})
Desktop.args = {
  date: new Date('17 July 2020 GMT+8'),
  title: 'Introducing Workspaces',
  description:
    'With the new Phone Number field, you can quickly collect people’s digits. Local and international validation available.',
  image: {
    url: WorkspaceFeatureUpdateImg,
    alt: 'Workspace Feature Update',
  },
}

import { Meta, Story } from '@storybook/react'

import { fullScreenDecorator } from '~utils/storybook'

import { RolloutAnnouncementModal } from './RolloutAnnouncementModal'

export default {
  title: 'Pages/RolloutAnnouncement',
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { delay: 200 },
  },
} as Meta

const Template: Story = () => <RolloutAnnouncementModal />

export const BasicUsage = Template.bind({})

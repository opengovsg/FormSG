import { Meta, StoryFn } from '@storybook/react-vite'

import { fullScreenDecorator, viewportModes } from '~utils/storybook'

import { RolloutAnnouncementModal } from './RolloutAnnouncementModal'

export default {
  title: 'Pages/RolloutAnnouncement',
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    // Prevent flaky tests due to modal animating in.
  },
} as Meta

const onClose = () => {
  return
}

const Template: StoryFn = () => (
  <RolloutAnnouncementModal onClose={onClose} isOpen={true} />
)

export const BasicUsage = Template.bind({})
BasicUsage.parameters = { argos: { modes: viewportModes('mobile') } }

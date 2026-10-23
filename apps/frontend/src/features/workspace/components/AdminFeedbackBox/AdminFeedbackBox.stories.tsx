import { useState } from 'react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { viewportModes } from '~utils/storybook'

import { AdminFeedbackBox } from './AdminFeedbackBox'

export default {
  title: 'Features/AdminFeedbackBox',
  component: AdminFeedbackBox,
  parameters: {
    // Fixed-position overlay: nothing in the story root's flow for
    // fit-to-content to measure, so capture the viewport.
    argos: { fitToContent: false },
  },
} as Meta

const Template: StoryFn = () => {
  const [isOpen, setIsOpen] = useState(true)
  return isOpen ? (
    <AdminFeedbackBox
      onClose={() => setIsOpen(false)}
      triggerSource="field-edit"
      formId="mock-form-id"
    />
  ) : (
    <button onClick={() => setIsOpen(true)}>Reopen feedback</button>
  )
}

export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('mobile') } }
Default.storyName = 'Empty state (no stars selected)'

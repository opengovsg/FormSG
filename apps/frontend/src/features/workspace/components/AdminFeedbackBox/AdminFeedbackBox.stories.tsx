import { useState } from 'react'
import { Meta, StoryFn } from '@storybook/react'

import { viewports } from '~/utils/storybook'

import { AdminFeedbackBox } from './AdminFeedbackBox'

export default {
  title: 'Features/AdminFeedbackBox',
  component: AdminFeedbackBox,
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
Default.storyName = 'Empty state (no stars selected)'

export const Mobile = Template.bind({})
Mobile.storyName = 'Mobile viewport'
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

import { Meta, StoryFn } from '@storybook/react'

import MrfWorkflowEmail, { type WorkflowEmailData } from './MrfWorkflowEmail'

export default {
  title: 'EmailPreview/MrfWorkflowEmail',
  component: MrfWorkflowEmail,
  decorators: [],
} as Meta

const Template: StoryFn<WorkflowEmailData> = (args) => (
  <MrfWorkflowEmail {...args} />
)

export const Default = Template.bind({})
Default.args = {
  formTitle: 'MRF Workflow',
  responseId: '1234',
  responseUrl: 'https://example.com',
}

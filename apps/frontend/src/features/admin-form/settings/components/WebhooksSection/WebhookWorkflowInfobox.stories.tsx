import { Meta, StoryFn } from '@storybook/react'

import { WebhookWorkflowInfobox } from './WebhookWorkflowInfobox'

export default {
  title: 'Features/AdminForm/Settings/WebhookWorkflowInfobox',
  component: WebhookWorkflowInfobox,
} as Meta

const Template: StoryFn = () => <WebhookWorkflowInfobox />

export const Default = Template.bind({})

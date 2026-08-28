import { Meta, StoryFn } from '@storybook/react'

import FormScheduledClosureNotification, {
  type FormScheduledClosureNotificationHtmlData,
} from '../emails/FormScheduledClosureNotification'

export default {
  title: 'EmailPreview/FormScheduledClosureNotification',
  component: FormScheduledClosureNotification,
  decorators: [],
} as Meta

const Template: StoryFn<FormScheduledClosureNotificationHtmlData> = (args) => (
  <FormScheduledClosureNotification {...args} />
)

export const Default = Template.bind({})
Default.args = {
  formTitle: 'Application for Something Important 2026',
  formLink: 'https://form.gov.sg/68b1f2a4c5d6e7f8a9b0c1d2',
  closedAt: 'Fri, 28 Aug 2026, 11:59 PM',
  appName: 'FormSG',
}

/** A long title, to check the card wraps rather than overflowing. */
export const LongFormTitle = Template.bind({})
LongFormTitle.args = {
  ...Default.args,
  formTitle:
    'Registration of Interest for the Community Engagement Programme Financial Year 2026 to 2027 Cycle Two',
}

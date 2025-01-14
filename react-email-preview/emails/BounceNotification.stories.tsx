import { Meta, StoryFn } from '@storybook/react'

import BounceNotification, {
  type BounceNotificationHtmlData,
} from './BounceNotification'

export default {
  title: 'EmailPreview/BounceNotification',
  component: BounceNotification,
  decorators: [],
} as Meta

const Template: StoryFn<BounceNotificationHtmlData> = (args) => (
  <BounceNotification {...args} />
)

export const Default = Template.bind({})
Default.args = {
  formTitle: 'Sum ting wong form',
  formLink: 'https://example.com',
  bouncedRecipients: 'recipient 1',
  appName: 'FormSG',
}

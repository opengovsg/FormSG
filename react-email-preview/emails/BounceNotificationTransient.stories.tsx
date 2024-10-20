import { Meta, StoryFn } from '@storybook/react'

import BounceNotificationTransient, {
  type BounceNotificationHtmlData,
} from './BounceNotificationTransient'

export default {
  title: 'EmailPreview/BounceNotificationTransient',
  component: BounceNotificationTransient,
  decorators: [],
} as Meta

const Template: StoryFn<BounceNotificationHtmlData> = (args) => (
  <BounceNotificationTransient {...args} />
)

export const Default = Template.bind({})
Default.args = {
  formTitle: 'Sum ting wong form',
  formLink: 'https://example.com',
  bouncedRecipients: 'recipient 1',
  appName: 'FormSG',
}

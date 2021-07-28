import { Meta, Story } from '@storybook/react'

import { InlineMessage, InlineMessageProps } from './InlineMessage'

export default {
  title: 'Components/InlineMessage',
  component: InlineMessage,
} as Meta

const InlineMessageTemplate: Story<InlineMessageProps> = (args) => (
  <InlineMessage {...args} />
)

export const Default = InlineMessageTemplate.bind({})
Default.args = {
  variant: 'info',
  children: `**Markdown** accepted. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
}

export const Info = InlineMessageTemplate.bind({})
Info.args = {
  variant: 'info',
  children: `View our [complete list](http://localhost:6006) of accepted file types. Please also read our [FAQ on email reliability](http://localhost:6006) relating to unaccepted file types.`,
}

export const Warning = InlineMessageTemplate.bind({})
Warning.args = {
  variant: 'warning',
  children: `The highlighted fields in this form have been pre-filled according to the link that you clicked. Please check that these values are what you intend to submit, and edit if necessary.`,
}

export const Error = InlineMessageTemplate.bind({})
Error.args = {
  variant: 'error',
  children: `Only 30 MyInfo fields are allowed in Email mode (30/30). [Learn more](http://localhost:6006)`,
}

import { Meta, StoryFn } from '@storybook/react-vite'

import { getMobileViewGlobals } from '~utils/storybook'

import { EmailListInput, EmailListInputProps } from './EmailListInput'

export default {
  title: 'Components/EmailListInput',
  component: EmailListInput,
  decorators: [],
  parameters: {
    actions: { argTypesRegex: '^on.*' },
  },
} as Meta<EmailListInputProps>

const Template: StoryFn<EmailListInputProps> = (args) => (
  <EmailListInput {...args} />
)
export const Default = Template.bind({})
Default.args = {}

export const WithEmails = Template.bind({})
WithEmails.args = {
  defaultValue: ['jane@agency.gov.sg', 'bob@agency.gov.sg'],
}

export const WithInvalidEmail = Template.bind({})
WithInvalidEmail.args = {
  isInvalid: true,
  defaultValue: ['jane@agency.gov.sg', 'bob@agency'],
}

export const Disabled = Template.bind({})
Disabled.args = {
  ...WithEmails.args,
  isDisabled: true,
}

export const Mobile = Template.bind({})
Mobile.args = {
  defaultValue: [
    'somethingreallylong_that_should_overflow_the_input@example.com',
    'jane@agency.gov.sg',
  ],
}
Mobile.globals = getMobileViewGlobals()
